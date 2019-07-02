pragma solidity 0.4.24;

import "@aragon/kits-beta-base/contracts/BetaKitBase.sol";

import "@tps/test-helpers/contracts/lib/bounties/StandardBounties.sol";

import "@tps/apps-address-book/contracts/AddressBook.sol";
import "@tps/apps-allocations/contracts/Allocations.sol";
import "@tps/apps-projects/contracts/Projects.sol";
import { DotVoting } from "@tps/apps-dot-voting/contracts/DotVoting.sol";
import { Rewards as Rewards } from "@tps/apps-rewards/contracts/Rewards.sol";


contract PlanningSuite is BetaKitBase {
    StandardBounties public registry;
    bytes32[5] public planningAppIds;
    uint256 constant PCT256 = 10 ** 16;
    uint64 constant PCT64 = 10 ** 16;
    address constant ANY_ENTITY = address(-1);

    mapping (address => address) tokenCache;

    // ensure alphabetic order
    enum PlanningApps { AddressBook, Allocations, DotVoting, Projects, Rewards }

    // Overload the DeployInstance event for easy grabing of all the things
    event DeployInstance(address dao, address indexed token, address vault, address voting);

    struct VoteParams {
        uint64 supportNeeded;
        uint64 minAcceptanceQuorum;
        uint64 voteDuration;
    }

    constructor(
        DAOFactory _fac,
        ENS _ens,
        MiniMeTokenFactory _minimeFac,
        IFIFSResolvingRegistrar _aragonID,
        bytes32[4] _appIds,
        bytes32[5] _planningAppIds,
        StandardBounties _registry
    )
        BetaKitBase(_fac, _ens, _minimeFac, _aragonID, _appIds)
        public
    {
        require(isContract(address(_fac.regFactory())), "REG_FACTORY_NOT_CONTRACT");

        planningAppIds = _planningAppIds;
        registry = _registry;
    }

    function newTokenAndInstance(
        string tokenName,
        string tokenSymbol,
        string aragonId,
        address[] holders,
        uint256[] tokens,
        uint64 supportNeeded,
        uint64 minAcceptanceQuorum,
        uint64 voteDuration
    ) public
    {
        newToken(tokenName, tokenSymbol);
        newInstance(
            aragonId,
            holders,
            tokens,
            supportNeeded,
            minAcceptanceQuorum,
            voteDuration
        );
    }

    function newToken(string tokenName, string tokenSymbol) public returns (MiniMeToken token) {
        token = minimeFac.createCloneToken(
            MiniMeToken(address(0)),
            0,
            tokenName,
            18,
            tokenSymbol,
            true
        );
        cacheToken(token, msg.sender);
    }

    function newInstance(
        string aragonId,
        address[] holders,
        uint256[] stakes,
        uint64 supportNeeded,
        uint64 minAcceptanceQuorum,
        uint64 voteDuration
    )
        public returns (Kernel dao, Vault vault, Voting voting)
    {
        require(voteDuration > 0, "VOTE_DURATION_IS_ZERO"); // TODO: remove it once we add it to Voting app
        MiniMeToken token = popTokenCache(msg.sender);
        (dao, vault, voting) = createPlanningDAO(
            token,
            holders,
            stakes,
            supportNeeded,
            minAcceptanceQuorum,
            voteDuration
        );
        registerAragonID(aragonId, dao);
        emit DeployInstance(dao, token, vault, voting);
    }

    function newPlanningApps(
        Kernel dao,
        Vault vault,
        Voting voting,
        MiniMeToken token,
        uint256 candidateSupportPct,
        uint256 minParticipationPct,
        uint64 voteDuration) public
    {
        addPlanningApps(
            dao,
            vault,
            voting,
            token,
            candidateSupportPct,
            minParticipationPct,
            voteDuration
        );
    }

    // Internal Functions
    function createPlanningDAO(
        MiniMeToken token,
        address[] holders,
        uint256[] stakes,
        uint64 supportNeeded,
        uint64 minAcceptanceQuorum,
        uint64 voteDuration
    )
        internal
        returns (
            Kernel dao,
            Vault vault,
            Voting voting
        )
    {
        dao = fac.newDAO(this);
        ACL acl = ACL(dao.acl());
        acl.createPermission(this, dao, dao.APP_MANAGER_ROLE(), this);
        (vault, voting) = createA1Apps(
            dao,
            holders,
            stakes,
            VoteParams(supportNeeded, minAcceptanceQuorum, voteDuration),
            token
        );
    }

    function addPlanningApps(
        Kernel dao,
        Vault vault,
        Voting voting,
        MiniMeToken token,
        uint256 candidateSupportPct,
        uint256 minParticipationPct,
        uint64 voteDuration
    ) internal
    {
        AddressBook addressBook;
        DotVoting dotVoting;

        (addressBook, dotVoting) = createDotVoting(
            dao,
            token,
            candidateSupportPct,
            minParticipationPct,
            voteDuration
        );
        createOtherTPSApps(
            dao,
            vault,
            voting,
            token,
            addressBook,
            dotVoting
        );
        handleCleanupPermissions(dao, voting);
    }

    //////////////////////////////////////////////////////////////
    // A1 Apps Internal Functions
    //////////////////////////////////////////////////////////////
    function createA1Apps(
        Kernel dao,
        address[] holders,
        uint256[] stakes,
        VoteParams voteParams,
        MiniMeToken token
        ) internal returns(
        Vault vault,
        Voting voting
    )
    {
        TokenManager tokenManager;
        Finance finance;
        // Aragon Apps
        tokenManager = TokenManager(
            dao.newAppInstance(
                appIds[uint8(Apps.TokenManager)],
                latestVersionAppBase(appIds[uint8(Apps.TokenManager)])
            )
        );
        vault = Vault(
            dao.newAppInstance(
                appIds[uint8(Apps.Vault)],
                latestVersionAppBase(appIds[uint8(Apps.Vault)]),
                new bytes(0),
                true
            )
        );
        finance = Finance(
            dao.newAppInstance(
                appIds[uint8(Apps.Finance)],
                latestVersionAppBase(appIds[uint8(Apps.Finance)])
            )
        );
        voting = Voting(
            dao.newAppInstance(
                appIds[uint8(Apps.Voting)],
                latestVersionAppBase(appIds[uint8(Apps.Voting)])
            )
        );

        initializeA1Apps(
            tokenManager,
            vault,
            finance,
            voting,
            voteParams,
            token
        );
        handleA1Permissions(
            dao,
            tokenManager,
            finance,
            voting,
            vault
        );
        for (uint256 i = 0; i < holders.length; i++) {
            tokenManager.mint(holders[i], stakes[i]);
        }
        ACL acl = ACL(dao.acl());
        cleanupPermission(acl, voting, tokenManager, tokenManager.MINT_ROLE());
    }

    function initializeA1Apps(
        TokenManager tokenManager,
        Vault vault,
        Finance finance,
        Voting voting,
        VoteParams voteParams,
        MiniMeToken token
    ) internal
    {
        token.changeController(tokenManager);
        // Initialize A1 apps
        tokenManager.initialize(token, true, 0);
        vault.initialize();
        finance.initialize(vault, 30 days);
        voting.initialize(token, voteParams.supportNeeded, voteParams.minAcceptanceQuorum, voteParams.voteDuration);
    }

    function handleA1Permissions(
        Kernel dao,
        TokenManager tokenManager,
        Finance finance,
        Voting voting,
        Vault vault
    ) internal
    {
        ACL acl = ACL(dao.acl());
        // Token Manager permissions
        acl.createPermission(this, tokenManager, tokenManager.MINT_ROLE(), this);
        acl.createPermission(voting, tokenManager, tokenManager.ASSIGN_ROLE(), voting);
        acl.createPermission(voting, tokenManager, tokenManager.REVOKE_VESTINGS_ROLE(), voting);
        emit InstalledApp(tokenManager, appIds[uint8(Apps.TokenManager)]);


        // Finance permissions
        acl.createPermission(voting, finance, finance.CREATE_PAYMENTS_ROLE(), voting);
        acl.createPermission(voting, finance, finance.EXECUTE_PAYMENTS_ROLE(), voting);
        acl.createPermission(voting, finance, finance.MANAGE_PAYMENTS_ROLE(), voting);
        acl.createPermission(finance, vault, vault.TRANSFER_ROLE(), this);
        emit InstalledApp(finance, appIds[uint8(Apps.Finance)]);

        // // Voting Permissions
        acl.createPermission(ANY_ENTITY, voting, voting.CREATE_VOTES_ROLE(), voting);
        acl.createPermission(voting, voting, voting.MODIFY_QUORUM_ROLE(), voting);
        emit InstalledApp(voting, appIds[uint8(Apps.Voting)]);


    }

    //////////////////////////////////////////////////////////////
    // TPS Apps Internal Functions
    //////////////////////////////////////////////////////////////
    function createDotVoting (
        Kernel dao,
        MiniMeToken token,
        uint256 candidateSupportPct,
        uint256 minParticipationPct,
        uint64 voteDuration
    ) internal returns (AddressBook addressBook, DotVoting dotVoting)
    {
        addressBook = AddressBook(
            dao.newAppInstance(
                planningAppIds[uint8(PlanningApps.AddressBook)],
                latestVersionAppBase(planningAppIds[uint8(PlanningApps.AddressBook)])
            )
        );
        dotVoting = DotVoting(
            dao.newAppInstance(
                planningAppIds[uint8(PlanningApps.DotVoting)],
                latestVersionAppBase(planningAppIds[uint8(PlanningApps.DotVoting)])
            )
        );

        addressBook.initialize();
        dotVoting.initialize(addressBook, token, minParticipationPct, candidateSupportPct, voteDuration);
    }

    function createOtherTPSApps (
        Kernel dao,
        Vault vault,
        Voting voting,
        MiniMeToken token,
        AddressBook addressBook,
        DotVoting dotVoting

    ) internal
    {
        Allocations allocations;
        Projects projects;
        Rewards rewards;

        // Planning Apps
        projects = Projects(
            dao.newAppInstance(
                planningAppIds[uint8(PlanningApps.Projects)],
                latestVersionAppBase(planningAppIds[uint8(PlanningApps.Projects)])
            )
        );
        allocations = Allocations(
            dao.newAppInstance(
                planningAppIds[uint8(PlanningApps.Allocations)],
                latestVersionAppBase(planningAppIds[uint8(PlanningApps.Allocations)])
            )
        );
        rewards = Rewards(
            dao.newAppInstance(
                planningAppIds[uint8(PlanningApps.Rewards)],
                latestVersionAppBase(planningAppIds[uint8(PlanningApps.Rewards)])
            )
        );
        initializeTPSApps(
            addressBook,
            allocations,
            projects,
            rewards,
            token,
            vault
        );
        handleTPSPermissions(
            dao,
            addressBook,
            allocations,
            dotVoting,
            projects,
            rewards,
            voting
        );
        handleVaultPermissions(
            dao,
            allocations,
            projects,
            rewards,
            vault,
            voting
        );

    }

    function initializeTPSApps(
        AddressBook addressBook,
        Allocations allocations,
        Projects projects,
        Rewards rewards,
        MiniMeToken token,
        Vault vault
    ) internal
    {
        allocations.initialize(addressBook, vault);
        projects.initialize(registry, vault, token);
        rewards.initialize(vault);
    }

    function handleTPSPermissions(
        Kernel dao,
        AddressBook addressBook,
        Allocations allocations,
        DotVoting dotVoting,
        Projects projects,
        Rewards rewards,
        Voting voting
    ) internal
    {
        ACL acl = ACL(dao.acl());

        // AddressBook permissions:
        acl.createPermission(voting, addressBook, addressBook.ADD_ENTRY_ROLE(), voting);
        acl.createPermission(voting, addressBook, addressBook.REMOVE_ENTRY_ROLE(), voting);
        emit InstalledApp(addressBook, planningAppIds[uint8(PlanningApps.AddressBook)]);


        // Projects permissions:
        acl.createPermission(voting, projects, projects.FUND_ISSUES_ROLE(), voting);
        acl.createPermission(voting, projects, projects.ADD_REPO_ROLE(), voting);
        acl.createPermission(voting, projects, projects.CHANGE_SETTINGS_ROLE(), voting);
        acl.createPermission(dotVoting, projects, projects.CURATE_ISSUES_ROLE(), voting);
        acl.createPermission(voting, projects, projects.REMOVE_REPO_ROLE(), voting);
        acl.createPermission(voting, projects, projects.REVIEW_APPLICATION_ROLE(), voting);
        acl.createPermission(voting, projects, projects.WORK_REVIEW_ROLE(), voting);
        emit InstalledApp(projects, planningAppIds[uint8(PlanningApps.Projects)]);

        // Dot-voting permissions
        acl.createPermission(ANY_ENTITY, dotVoting, dotVoting.CREATE_VOTES_ROLE(), voting);
        acl.createPermission(ANY_ENTITY, dotVoting, dotVoting.ADD_CANDIDATES_ROLE(), voting);
        emit InstalledApp(dotVoting, planningAppIds[uint8(PlanningApps.DotVoting)]);

        // Allocations permissions:
        acl.createPermission(voting, allocations, allocations.CREATE_ACCOUNT_ROLE(), voting);
        acl.createPermission(dotVoting, allocations, allocations.CREATE_ALLOCATION_ROLE(), voting);
        acl.createPermission(ANY_ENTITY, allocations, allocations.EXECUTE_ALLOCATION_ROLE(), voting);
        emit InstalledApp(allocations, planningAppIds[uint8(PlanningApps.Allocations)]);

        // Rewards permissions:
        acl.createPermission(voting, rewards, rewards.ADD_REWARD_ROLE(), voting);
        emit InstalledApp(rewards, planningAppIds[uint8(PlanningApps.Rewards)]);
    }

    //////////////////////////////////////////////////////////////
    // Additional Internal Helpers
    //////////////////////////////////////////////////////////////

    function handleVaultPermissions(
        Kernel dao,
        Allocations allocations,
        Projects projects,
        Rewards rewards,
        Vault vault,
        Voting voting
    ) internal
    {
        ACL acl = ACL(dao.acl());
        bytes32 vaultTransferRole = vault.TRANSFER_ROLE();

        // Vault permissions
        acl.grantPermission(projects, vault, vaultTransferRole);
        acl.grantPermission(allocations, vault, vaultTransferRole);
        acl.grantPermission(rewards, vault, vaultTransferRole);
        cleanupPermission(acl, voting, vault, vaultTransferRole);
        emit InstalledApp(vault, appIds[uint8(Apps.Vault)]);
    }

    function handleCleanupPermissions(Kernel dao, Voting voting) internal {
        ACL acl = ACL(dao.acl());


        // Clean up template permissions
        cleanupPermission(acl, voting, dao, dao.APP_MANAGER_ROLE());
        cleanupPermission(acl, voting, acl, acl.CREATE_PERMISSIONS_ROLE());
    }

}