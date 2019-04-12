
pragma solidity 0.4.24;

import "@aragon/kits-beta-base/contracts/BetaKitBase.sol";

import "@tps/test-helpers/contracts/lib/bounties/StandardBounties.sol";

import "@tps/apps-address-book/contracts/AddressBook.sol";
import "@tps/apps-allocations/contracts/Allocations.sol";
import "@tps/apps-projects/contracts/Projects.sol";
import { RangeVoting as Range } from "@tps/apps-range-voting/contracts/RangeVoting.sol";
// import { RewardsCore as Rewards } from "@tps/apps-rewards/contracts/RewardsCore.sol";


contract PlanningKitBase is BetaKitBase {
    StandardBounties public registry;
    bytes32[4] public planningAppIds; // TODO: 5 when adding rewards
    uint256 constant PCT256 = 10 ** 16;
    address constant ANY_ENTITY = address(-1);

    mapping (address => address) tokenCache;

    // ensure alphabetic order
    enum PlanningApps { AddressBook, Allocations, Projects, Range } // TODO: Add Rewards here

    // TODO: Do we need events here? (we have 2 inherited from betakitbase)
    event DeployInstance(address dao, address indexed token);

    constructor(
        DAOFactory _fac,
        ENS _ens,
        MiniMeTokenFactory _minimeFac,
        IFIFSResolvingRegistrar _aragonID,
        bytes32[4] _appIds,
        bytes32[4] _planningAppIds,
        StandardBounties _registry
    )
        BetaKitBase(_fac, _ens, _minimeFac, _aragonID, _appIds)
        public
    {
        require(isContract(address(_fac.regFactory())), "REG_FACTORY_NOT_CONTRACT");

        planningAppIds = _planningAppIds;
        registry = _registry;
    }

    function createPlanningDAO(
        string aragonId,
        MiniMeToken token,
        address[] holders,
        uint256[] stakes,
        uint256 maxTokens
    )
        internal
        returns (
            Kernel dao,
            ACL acl,
            Finance finance,
            TokenManager tokenManager,
            Vault vault,
            Voting voting,
            AddressBook addressBook,
            Range rangeVoting
        )
    {
        // Create the base DAO with every aragon app
        (dao, acl, finance, tokenManager, vault, voting, addressBook, rangeVoting) = createDAO(
            aragonId,
            token,
            holders,
            stakes,
            maxTokens
        );
        
        // Install the Planning Suite apps
        createTPSApps(dao, token, vault, voting);

        // Cleanup
        doCleanup(dao, voting);

        return (
            dao,
            acl,
            finance,
            tokenManager,
            vault,
            voting,
            addressBook,
            rangeVoting
        );
    }

    function createTPSApps(
        Kernel dao,
        MiniMeToken token,
        Vault vault,
        Voting voting
        )
        internal
        returns (
            AddressBook addressBook,
            Allocations allocations,
            Projects projects,
            Range rangeVoting
            // Rewards rewards
        )
    {
        ACL acl = ACL(dao.acl());
        
        addressBook = AddressBook(
            dao.newAppInstance(
                planningAppIds[uint8(PlanningApps.AddressBook)],
                latestVersionAppBase(planningAppIds[uint8(PlanningApps.AddressBook)]),
                // TODO: check what are this extra params:
                new bytes(0),
                true
            )
        );
        emit InstalledApp(addressBook, planningAppIds[uint8(PlanningApps.AddressBook)]);

        allocations = Allocations(
            dao.newAppInstance(
                planningAppIds[uint8(PlanningApps.Allocations)],
                latestVersionAppBase(planningAppIds[uint8(PlanningApps.Allocations)])
            )
        );
        emit InstalledApp(allocations, planningAppIds[uint8(PlanningApps.Allocations)]);

        projects = Projects(
            dao.newAppInstance(
                planningAppIds[uint8(PlanningApps.Projects)],
                latestVersionAppBase(planningAppIds[uint8(PlanningApps.Projects)])
            )
        );
        emit InstalledApp(projects, planningAppIds[uint8(PlanningApps.Projects)]);

        rangeVoting = Range(
            dao.newAppInstance(
                planningAppIds[uint8(PlanningApps.Range)],
                latestVersionAppBase(planningAppIds[uint8(PlanningApps.Range)])
            )
        );
        emit InstalledApp(rangeVoting, planningAppIds[uint8(PlanningApps.Range)]);

        // rewards = Rewards(
        //     dao.newAppInstance(
        //         planningAppIds[uint8(PlanningApps.Rewards)],
        //         latestVersionAppBase(planningAppIds[uint8(PlanningApps.Rewards)])
        //     )
        // );
        // emit InstalledApp(rewards, planningAppIds[uint8(PlanningApps.Rewards)]);

        // Handle permissions creation
        acl.createPermission(this, dao, dao.APP_MANAGER_ROLE(), this);
        handleTPSPermissions(acl, addressBook, allocations, projects, rangeVoting, /*rewards,*/ voting);
        handleVaultPermissions(acl, projects, /*rewards,*/ vault);

        // Initialize the Planning Suite apps
        initTPSApps(addressBook, allocations, projects, rangeVoting, /*rewards,*/ token, vault);
    }

    function handleTPSPermissions(
        ACL acl,
        AddressBook addressBook,
        Allocations allocations,
        Projects projects,
        Range rangeVoting,
        // Rewards rewards,
        Voting voting
        ) internal
    {
        address root = msg.sender;

        // AddressBook permissions:
        acl.createPermission(ANY_ENTITY, addressBook, addressBook.ADD_ENTRY_ROLE(), root);
        acl.createPermission(ANY_ENTITY, addressBook, addressBook.REMOVE_ENTRY_ROLE(), root);

        // Projects permissions:
        acl.createPermission(voting, projects, projects.ADD_BOUNTY_ROLE(), root);
        acl.createPermission(ANY_ENTITY, projects, projects.ADD_REPO_ROLE(), root);
        acl.createPermission(ANY_ENTITY, projects, projects.CHANGE_SETTINGS_ROLE(), root);
        acl.createPermission(rangeVoting, projects, projects.CURATE_ISSUES_ROLE(), root);
        acl.createPermission(ANY_ENTITY, projects, projects.REMOVE_REPO_ROLE(), root);
        acl.createPermission(ANY_ENTITY, projects, projects.TASK_ASSIGNMENT_ROLE(), root);
        acl.createPermission(ANY_ENTITY, projects, projects.WORK_REVIEW_ROLE(), root);

        // Range-voting permissions
        acl.createPermission(ANY_ENTITY, rangeVoting, rangeVoting.CREATE_VOTES_ROLE(), root);
        acl.createPermission(ANY_ENTITY, rangeVoting, rangeVoting.ADD_CANDIDATES_ROLE(), root);
        acl.createPermission(ANY_ENTITY, rangeVoting, rangeVoting.MODIFY_PARTICIPATION_ROLE(), root);

        // Allocations permissions:
        acl.createPermission(ANY_ENTITY, allocations, allocations.START_PAYOUT_ROLE(), root);
        acl.createPermission(rangeVoting, allocations, allocations.SET_DISTRIBUTION_ROLE(), root);
        acl.createPermission(ANY_ENTITY, allocations, allocations.EXECUTE_PAYOUT_ROLE(), root);

        // Rewards Permissions
        // acl.createPermission(ANY_ENTITY, rewards, rewards.ADD_REWARD_ROLE(), root);
    }

    function handleVaultPermissions(ACL acl, Projects projects, /*Rewards rewards,*/ Vault vault) internal {
        address root = msg.sender;

        // Vault permissions
        acl.createPermission(root, vault, vault.TRANSFER_ROLE(), this);
        acl.grantPermission(projects, vault, vault.TRANSFER_ROLE());
        // acl.grantPermission(rewards, vault, vault.TRANSFER_ROLE());
    }

    function initTPSApps(
        AddressBook addressBook,
        Allocations allocations,
        Projects projects,
        // Rewards rewards,
        MiniMeToken token,
        Vault vault
        ) internal
    {
        addressBook.initialize();
        projects.initialize(registry, vault);
        allocations.initialize(addressBook);
        // rewards.initialize(vault);
    }

    function doCleanup(Kernel dao, Voting voting) internal {
        ACL acl = ACL(dao.acl());
        cleanupPermission(acl, voting, dao, dao.APP_MANAGER_ROLE());
    }
}