pragma solidity 0.4.24;

import "@aragon/kits-beta-base/contracts/BetaKitBase.sol";

import "@tps/test-helpers/contracts/lib/bounties/StandardBounties.sol";

import "@tps/apps-address-book/contracts/AddressBook.sol";
import "@tps/apps-allocations/contracts/Allocations.sol";
import "@tps/apps-projects/contracts/Projects.sol";
import { DotVoting } from "@tps/apps-dot-voting/contracts/DotVoting.sol";
import { RewardsCore as Rewards } from "@tps/apps-rewards/contracts/RewardsCore.sol";


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
        uint candidateSupportPct,
        uint minParticipationPct,
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
        bytes32 appManagerRole = dao.APP_MANAGER_ROLE();
        acl.createPermission(this, dao, appManagerRole, this);
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
        uint candidateSupportPct,
        uint minParticipationPct,
        uint64 voteDuration
    ) internal
    {
        createTPSApps(
            dao,
            vault,
            voting,
            token,
            candidateSupportPct,
            minParticipationPct,
            voteDuration
        );
        handleCleanupPermissions(dao);
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
            voting
        );
        for (uint256 i = 0; i < holders.length; i++) {
            tokenManager.mint(holders[i], stakes[i]);
        }
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
        finance.initialize(vault, 1 days);
        voting.initialize(token, voteParams.supportNeeded, voteParams.minAcceptanceQuorum, voteParams.voteDuration);
    }

    function handleA1Permissions(
        Kernel dao,
        TokenManager tokenManager,
        Finance finance,
        Voting voting
    ) internal
    {
        address root = msg.sender;
        ACL acl = ACL(dao.acl());
        // Token Manager permissions
        acl.createPermission(ANY_ENTITY, tokenManager, tokenManager.MINT_ROLE(), this);
        acl.createPermission(ANY_ENTITY, tokenManager, tokenManager.ISSUE_ROLE(), root);
        acl.createPermission(ANY_ENTITY, tokenManager, tokenManager.ASSIGN_ROLE(), root);
        acl.createPermission(ANY_ENTITY, tokenManager, tokenManager.REVOKE_VESTINGS_ROLE(), root);
        emit InstalledApp(tokenManager, appIds[uint8(Apps.TokenManager)]);

        // Finance permissions
        acl.createPermission(ANY_ENTITY, finance, finance.CREATE_PAYMENTS_ROLE(), root);
        acl.createPermission(ANY_ENTITY, finance, finance.CHANGE_PERIOD_ROLE(), root);
        acl.createPermission(ANY_ENTITY, finance, finance.CHANGE_BUDGETS_ROLE(), root);
        acl.createPermission(ANY_ENTITY, finance, finance.EXECUTE_PAYMENTS_ROLE(), root);
        acl.createPermission(ANY_ENTITY, finance, finance.MANAGE_PAYMENTS_ROLE(), root);
        emit InstalledApp(finance, appIds[uint8(Apps.Finance)]);

        // // Voting Permissions
        acl.createPermission(ANY_ENTITY, voting, voting.CREATE_VOTES_ROLE(), root);
        acl.createPermission(ANY_ENTITY, voting, voting.MODIFY_SUPPORT_ROLE(), root);
        acl.createPermission(ANY_ENTITY, voting, voting.MODIFY_QUORUM_ROLE(), root);
        emit InstalledApp(voting, appIds[uint8(Apps.Voting)]);


    }

    //////////////////////////////////////////////////////////////
    // TPS Apps Internal Functions
    //////////////////////////////////////////////////////////////
    function createTPSApps (
        Kernel dao,
        Vault vault,
        Voting voting,
        MiniMeToken token,
        uint candidateSupportPct,
        uint minParticipationPct,
        uint64 voteDuration
    ) internal
    {
        AddressBook addressBook;
        Allocations allocations;
        DotVoting dotVoting;
        Projects projects;
        Rewards rewards;

        // Planning Apps
        addressBook = AddressBook(
            dao.newAppInstance(
                planningAppIds[uint8(PlanningApps.AddressBook)],
                latestVersionAppBase(planningAppIds[uint8(PlanningApps.AddressBook)])
            )
        );
        projects = Projects(
            dao.newAppInstance(
                planningAppIds[uint8(PlanningApps.Projects)],
                latestVersionAppBase(planningAppIds[uint8(PlanningApps.Projects)])
            )
        );
        dotVoting = DotVoting(
            dao.newAppInstance(
                planningAppIds[uint8(PlanningApps.DotVoting)],
                latestVersionAppBase(planningAppIds[uint8(PlanningApps.DotVoting)])
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
            dotVoting,
            projects,
            rewards,
            token,
            vault,
            candidateSupportPct,
            minParticipationPct,
            voteDuration
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
            vault
        );

    }

    function initializeTPSApps(
        AddressBook addressBook,
        Allocations allocations,
        DotVoting dotVoting,
        Projects projects,
        Rewards rewards,
        MiniMeToken token,
        Vault vault,
        uint candidateSupportPct,
        uint minParticipationPct,
        uint64 voteDuration
    ) internal
    {
        string memory tokenSymbol = token.symbol();
        addressBook.initialize();
        allocations.initialize(addressBook, vault);
        dotVoting.initialize(addressBook, token, minParticipationPct, candidateSupportPct, voteDuration);
        projects.initialize(registry, vault, tokenSymbol);
        rewards.initialize(vault);
    }

    function handleTPSPermissions(
        Kernel dao,
        Allocations allocations,
        AddressBook addressBook,
        DotVoting dotVoting,
        Projects projects,
        Rewards rewards,
        Voting voting
    ) internal
    {
        address root = msg.sender;
        ACL acl = ACL(dao.acl());

        // AddressBook permissions:
        acl.createPermission(ANY_ENTITY, addressBook, addressBook.ADD_ENTRY_ROLE(), root);
        acl.createPermission(ANY_ENTITY, addressBook, addressBook.REMOVE_ENTRY_ROLE(), root);
        emit InstalledApp(addressBook, planningAppIds[uint8(PlanningApps.AddressBook)]);


        // Projects permissions:
        acl.createPermission(voting, projects, projects.ADD_BOUNTY_ROLE(), root);
        acl.createPermission(ANY_ENTITY, projects, projects.ADD_REPO_ROLE(), root);
        acl.createPermission(ANY_ENTITY, projects, projects.CHANGE_SETTINGS_ROLE(), root);
        acl.createPermission(dotVoting, projects, projects.CURATE_ISSUES_ROLE(), root);
        acl.createPermission(ANY_ENTITY, projects, projects.REMOVE_REPO_ROLE(), root);
        acl.createPermission(ANY_ENTITY, projects, projects.TASK_ASSIGNMENT_ROLE(), root);
        acl.createPermission(ANY_ENTITY, projects, projects.WORK_REVIEW_ROLE(), root);
        emit InstalledApp(projects, planningAppIds[uint8(PlanningApps.Projects)]);

        // Dot-voting permissions
        acl.createPermission(ANY_ENTITY, dotVoting, dotVoting.CREATE_VOTES_ROLE(), root);
        acl.createPermission(ANY_ENTITY, dotVoting, dotVoting.ADD_CANDIDATES_ROLE(), root);
        acl.createPermission(ANY_ENTITY, dotVoting, dotVoting.MODIFY_PARTICIPATION_ROLE(), root);
        emit InstalledApp(dotVoting, planningAppIds[uint8(PlanningApps.DotVoting)]);

        // Allocations permissions:
        acl.createPermission(ANY_ENTITY, allocations, allocations.START_PAYOUT_ROLE(), root);
        acl.createPermission(dotVoting, allocations, allocations.SET_DISTRIBUTION_ROLE(), root);
        acl.createPermission(ANY_ENTITY, allocations, allocations.EXECUTE_PAYOUT_ROLE(), root);
        emit InstalledApp(allocations, planningAppIds[uint8(PlanningApps.Allocations)]);

        // Rewards permissions:
        acl.createPermission(ANY_ENTITY, rewards, rewards.ADD_REWARD_ROLE(), root);
        emit InstalledApp(rewards, planningAppIds[uint8(PlanningApps.Rewards)]);
    }

    //////////////////////////////////////////////////////////////
    // Additional Internal Helpers
    //////////////////////////////////////////////////////////////
    
    function handleVaultPermissions(Kernel dao, Allocations allocations, Projects projects, Rewards rewards, Vault vault) internal {
        address root = msg.sender;

        ACL acl = ACL(dao.acl());
        // Vault permissions
        acl.createPermission(root, vault, vault.TRANSFER_ROLE(), this);
        acl.grantPermission(projects, vault, vault.TRANSFER_ROLE());
        acl.grantPermission(allocations, vault, vault.TRANSFER_ROLE());
        acl.grantPermission(rewards, vault, vault.TRANSFER_ROLE());
        emit InstalledApp(vault, appIds[uint8(Apps.Vault)]);
    }

    function handleCleanupPermissions(Kernel dao) internal {
        ACL acl = ACL(dao.acl());
        address root = msg.sender;
        bytes32 appManagerRole = dao.APP_MANAGER_ROLE();

        // Clean up template permissions
        acl.grantPermission(root, dao, appManagerRole);
        acl.revokePermission(this, dao, appManagerRole);
        acl.setPermissionManager(root, dao, appManagerRole);

        acl.grantPermission(root, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.revokePermission(this, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.setPermissionManager(root, acl, acl.CREATE_PERMISSIONS_ROLE());
    }

}