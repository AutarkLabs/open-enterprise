
pragma solidity 0.4.24;

import "@aragon/kits-beta-base/contracts/BetaKitBase.sol";

import "@tps/test-helpers/contracts/lib/bounties/StandardBounties.sol";

import "@tps/apps-address-book/contracts/AddressBook.sol";
import "@tps/apps-allocations/contracts/Allocations.sol";
import "@tps/apps-projects/contracts/Projects.sol";
import { RangeVoting } from "@tps/apps-range-voting/contracts/RangeVoting.sol";
// import { RewardsCore as Rewards } from "@tps/apps-rewards/contracts/RewardsCore.sol";


contract PlanningKitBase is BetaKitBase {
    StandardBounties public registry;
    bytes32[4] public planningAppIds; // TODO: 5 when adding rewards
    uint256 constant PCT256 = 10 ** 16;
    uint64 constant PCT64 = 10 ** 16;
    address constant ANY_ENTITY = address(-1);

    mapping (address => address) tokenCache;

    // ensure alphabetic order
    enum PlanningApps { AddressBook, Allocations, Projects, RangeVoting } // TODO: Add Rewards here

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
            Kernel dao//,
            // ACL acl,
            // Finance finance,
            // TokenManager tokenManager,
            // Vault vault,
            // Voting voting
        )
    {
        dao = fac.newDAO(this);
        ACL acl = ACL(dao.acl());

        bytes32 appManagerRole = dao.APP_MANAGER_ROLE();
        acl.createPermission(this, dao, appManagerRole, this);
        address root = msg.sender;
        Vault vault;
        Voting voting;

        (vault, voting) = createA1Apps(root, acl, dao, token);

        createTPSApps(root, dao, vault, voting, token);

        handleCleanupPermissions(dao, acl, root);

        emit DeployInstance(dao, token);

        // OLD code:
        // TokenManager tokenManager;
        // Vault vault;
        // Voting voting;
        // // Create the base DAO with every aragon app
        // // (dao, acl, finance, tokenManager, vault, voting) = createNewDAO(
        // (dao, vault, voting) = createNewDAO(
        //     aragonId,
        //     token,
        //     holders,
        //     stakes,
        //     maxTokens
        // );

        // // Install the Planning Suite apps
        // createTPSApps(dao, token, vault, voting);

        // // Cleanup
        // // doCleanup(dao, voting);

        // return (
        //     dao//,
        //     // acl,
        //     // finance,
        //     // tokenManager,
        //     // // vault,
        //     // voting
        // );
    }

    function createA1Apps(address root, ACL acl, Kernel dao, MiniMeToken token) internal returns(
        Vault vault,
        Voting voting
    )
    {
        TokenManager tokenManager;
        Finance finance;
        // bytes32[4] memory apps = [
        //     apmNamehash("token-manager"),   // 0
        //     apmNamehash("vault"),           // 1
        //     apmNamehash("finance"),         // 2
        //     apmNamehash("voting")           // 3
        // ];

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
                latestVersionAppBase(appIds[uint8(Apps.Vault)])
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

        initializeA1Apps(root, tokenManager, vault, finance, voting, token);
        handleA1Permissions(
            dao,
            acl,
            root,
            tokenManager,
            vault,
            finance,
            voting
        );
    }

    function initializeA1Apps(
        address root,
        TokenManager tokenManager,
        Vault vault,
        Finance finance,
        Voting voting,
        MiniMeToken token
    ) internal
    {

        token.changeController(tokenManager);
        // Initialize A1 apps
        tokenManager.initialize(token, true, 0);
        // vault.initialize();
        // finance.initialize(vault, 1 days);
        // token.approve(finance, 100 ether);
        // voting.initialize(token, 50 * PCT64, 10 * PCT64, 1 days);
        // finance.deposit(token, 50 ether, "Initial token transfer pt 1");
        // finance.deposit(token, 50 ether, "Initial token transfer pt 2");
    }

    function handleA1Permissions(
        Kernel dao,
        ACL acl,
        address root,
        TokenManager tokenManager,
        Vault vault,
        Finance finance,
        Voting voting
    ) internal
    {

        // Token Manager permissions
        // acl.createPermission(ANY_ENTITY, tokenManager, tokenManager.MINT_ROLE(), this);
        // acl.createPermission(ANY_ENTITY, tokenManager, tokenManager.ISSUE_ROLE(), root);
        // acl.createPermission(ANY_ENTITY, tokenManager, tokenManager.ASSIGN_ROLE(), root);
        // acl.createPermission(ANY_ENTITY, tokenManager, tokenManager.REVOKE_VESTINGS_ROLE(), root);

        // Finance permissions
        // acl.createPermission(ANY_ENTITY, finance, finance.CREATE_PAYMENTS_ROLE(), root);
        // acl.createPermission(ANY_ENTITY, finance, finance.CHANGE_PERIOD_ROLE(), root);
        // acl.createPermission(ANY_ENTITY, finance, finance.CHANGE_BUDGETS_ROLE(), root);
        // acl.createPermission(ANY_ENTITY, finance, finance.EXECUTE_PAYMENTS_ROLE(), root);
        // acl.createPermission(ANY_ENTITY, finance, finance.MANAGE_PAYMENTS_ROLE(), root);

        // // Voting Permissions
        // acl.createPermission(ANY_ENTITY, voting, voting.CREATE_VOTES_ROLE(), root);
        // acl.createPermission(ANY_ENTITY, voting, voting.MODIFY_SUPPORT_ROLE(), root);
        // acl.createPermission(ANY_ENTITY, voting, voting.MODIFY_QUORUM_ROLE(), root);

    }

    function createTPSApps (address root, Kernel dao, Vault vault, Voting voting, MiniMeToken token) internal {
        AddressBook addressBook;
        Projects projects;
        RangeVoting rangeVoting;
        Allocations allocations;
        // Rewards rewards;


        // bytes32[4] memory apps = [
        //     apmNamehash("address-book"),    // 0
        //     apmNamehash("projects"),        // 1
        //     apmNamehash("range-voting"),    // 2
        //     apmNamehash("allocations")//,     // 3
        //     // apmNamehash("rewards")          // 4
        // ];

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
        rangeVoting = RangeVoting(
            dao.newAppInstance(
                planningAppIds[uint8(PlanningApps.RangeVoting)],
                latestVersionAppBase(planningAppIds[uint8(PlanningApps.RangeVoting)])
            )
        );
        allocations = Allocations(
            dao.newAppInstance(
                planningAppIds[uint8(PlanningApps.Allocations)],
                latestVersionAppBase(planningAppIds[uint8(PlanningApps.Allocations)])
            )
        );
        // rewards = Rewards(dao.newAppInstance(apps[4], latestVersionAppBase(apps[4])));
        initializeTPSApps(addressBook, projects, rangeVoting, allocations, /*rewards,*/ vault, token);
        handleTPSPermissions(
            dao,
            addressBook,
            projects,
            rangeVoting,
            allocations,
            // rewards,
            voting
        );
        handleVaultPermissions(
            dao,
            projects,
            allocations,
            // rewards,
            vault
        );

    }

    function initializeTPSApps(
        AddressBook addressBook,
        Projects projects,
        RangeVoting rangeVoting,
        Allocations allocations,
        // Rewards rewards,
        Vault vault,
        MiniMeToken token
    ) internal
    {
        address root = msg.sender;
        addressBook.initialize();
        projects.initialize(registry, vault);
        // TODO: new projects version:
        // projects.initialize(registry, vault, "autark");
        rangeVoting.initialize(addressBook, token, 50 * PCT256, 0, 1 minutes);
        allocations.initialize(addressBook);
        // TODO: new allocations version:
        // allocations.initialize(addressBook, vault);
        // rewards.initialize(vault);
    }

    function handleTPSPermissions(
        Kernel dao,
        AddressBook addressBook,
        Projects projects,
        RangeVoting rangeVoting,
        Allocations allocations,
        // Rewards rewards,
        Voting voting
    ) internal
    {
        address root = msg.sender;

        ACL acl = ACL(dao.acl());

        // AddressBook permissions:
        acl.createPermission(ANY_ENTITY, addressBook, addressBook.ADD_ENTRY_ROLE(), root);
        acl.createPermission(ANY_ENTITY, addressBook, addressBook.REMOVE_ENTRY_ROLE(), root);
        // emit InstalledApp(addressBook, addressBookAppId);


        // Projects permissions:
        acl.createPermission(voting, projects, projects.ADD_BOUNTY_ROLE(), root);
        acl.createPermission(ANY_ENTITY, projects, projects.ADD_REPO_ROLE(), root);
        acl.createPermission(ANY_ENTITY, projects, projects.CHANGE_SETTINGS_ROLE(), root);
        acl.createPermission(rangeVoting, projects, projects.CURATE_ISSUES_ROLE(), root);
        acl.createPermission(ANY_ENTITY, projects, projects.REMOVE_REPO_ROLE(), root);
        acl.createPermission(ANY_ENTITY, projects, projects.TASK_ASSIGNMENT_ROLE(), root);
        acl.createPermission(ANY_ENTITY, projects, projects.WORK_REVIEW_ROLE(), root);
        // emit InstalledApp(projects, apps[2]);

        // Range-voting permissions
        acl.createPermission(ANY_ENTITY, rangeVoting, rangeVoting.CREATE_VOTES_ROLE(), root);
        acl.createPermission(ANY_ENTITY, rangeVoting, rangeVoting.ADD_CANDIDATES_ROLE(), root);
        acl.createPermission(ANY_ENTITY, rangeVoting, rangeVoting.MODIFY_PARTICIPATION_ROLE(), root);
        // emit InstalledApp(rangeVoting, apps[3]);

        // Allocations permissions:
        acl.createPermission(ANY_ENTITY, allocations, allocations.START_PAYOUT_ROLE(), root);
        acl.createPermission(rangeVoting, allocations, allocations.SET_DISTRIBUTION_ROLE(), root);
        acl.createPermission(ANY_ENTITY, allocations, allocations.EXECUTE_PAYOUT_ROLE(), root);
        // emit InstalledApp(allocations, apps[1]);

        // Rewards Permissions
        // acl.createPermission(ANY_ENTITY, rewards, rewards.ADD_REWARD_ROLE(), root);

    }

    function handleVaultPermissions(Kernel dao, Projects projects, Allocations allocations, /*Rewards rewards,*/ Vault vault) internal {
        address root = msg.sender;

        ACL acl = ACL(dao.acl());
        // Vault permissions
        acl.createPermission(root, vault, vault.TRANSFER_ROLE(), this);
        acl.grantPermission(projects, vault, vault.TRANSFER_ROLE());
        acl.grantPermission(allocations, vault, vault.TRANSFER_ROLE());
        // acl.grantPermission(rewards, vault, vault.TRANSFER_ROLE());
    }

    function handleCleanupPermissions(Kernel dao, ACL acl, address root) internal {
        bytes32 appManagerRole = dao.APP_MANAGER_ROLE();

        // Clean up template permissions
        acl.grantPermission(root, dao, appManagerRole);
        acl.revokePermission(this, dao, appManagerRole);
        acl.setPermissionManager(root, dao, appManagerRole);

        acl.grantPermission(root, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.revokePermission(this, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.setPermissionManager(root, acl, acl.CREATE_PERMISSIONS_ROLE());
    }

    // old
    function createNewDAO(
        string name,
        MiniMeToken token,
        address[] holders,
        uint256[] stakes,
        uint256 _maxTokens
    )
        internal
        returns (
            Kernel dao,
            // ACL acl,
            // Finance finance,
            // TokenManager tokenManager,
            Vault vault,
            Voting voting
        )
    {
        require(holders.length == stakes.length);
        address root = msg.sender;

        dao = fac.newDAO(this);

        ACL acl = ACL(dao.acl());

        acl.createPermission(this, dao, dao.APP_MANAGER_ROLE(), this);

        voting = Voting(
            dao.newAppInstance(
                appIds[uint8(Apps.Voting)],
                latestVersionAppBase(appIds[uint8(Apps.Voting)])
            )
        );
        emit InstalledApp(voting, appIds[uint8(Apps.Voting)]);

        vault = Vault(
            dao.newAppInstance(
                appIds[uint8(Apps.Vault)],
                latestVersionAppBase(appIds[uint8(Apps.Vault)]),
                new bytes(0),
                true
            )
        );
        emit InstalledApp(vault, appIds[uint8(Apps.Vault)]);

        Finance finance = Finance(
            dao.newAppInstance(
                appIds[uint8(Apps.Finance)],
                latestVersionAppBase(appIds[uint8(Apps.Finance)])
            )
        );
        emit InstalledApp(finance, appIds[uint8(Apps.Finance)]);

        TokenManager tokenManager = TokenManager(
            dao.newAppInstance(
                appIds[uint8(Apps.TokenManager)],
                latestVersionAppBase(appIds[uint8(Apps.TokenManager)])
            )
        );
        emit InstalledApp(tokenManager, appIds[uint8(Apps.TokenManager)]);

        // Required for initializing the Token Manager
        token.changeController(tokenManager);

        // permissions
        acl.createPermission(tokenManager, voting, voting.CREATE_VOTES_ROLE(), voting);
        acl.createPermission(voting, voting, voting.MODIFY_QUORUM_ROLE(), voting);
        // acl.createPermission(finance, vault, vault.TRANSFER_ROLE(), voting);
        acl.createPermission(root, vault, vault.TRANSFER_ROLE(), this);
        acl.createPermission(voting, finance, finance.CREATE_PAYMENTS_ROLE(), voting);
        acl.createPermission(voting, finance, finance.EXECUTE_PAYMENTS_ROLE(), voting);
        acl.createPermission(voting, finance, finance.MANAGE_PAYMENTS_ROLE(), voting);
        acl.createPermission(voting, tokenManager, tokenManager.ASSIGN_ROLE(), voting);
        acl.createPermission(voting, tokenManager, tokenManager.REVOKE_VESTINGS_ROLE(), voting);

        // App inits
        vault.initialize();
        finance.initialize(vault, 30 days);
        tokenManager.initialize(token, _maxTokens > 1, _maxTokens);

        // Set up the token stakes
        acl.createPermission(this, tokenManager, tokenManager.MINT_ROLE(), this);

        for (uint256 i = 0; i < holders.length; i++) {
            tokenManager.mint(holders[i], stakes[i]);
        }

        // Clean right now since the mint role is not needed anymore
        cleanupPermission(acl, voting, tokenManager, tokenManager.MINT_ROLE());

        // EVMScriptRegistry permissions
        EVMScriptRegistry reg = EVMScriptRegistry(acl.getEVMScriptRegistry());
        acl.createPermission(voting, reg, reg.REGISTRY_ADD_EXECUTOR_ROLE(), voting);
        acl.createPermission(voting, reg, reg.REGISTRY_MANAGER_ROLE(), voting);

        registerAragonID(name, dao);
        emit DeployInstance(dao, token);

        // return (dao, /*acl,*/ finance, tokenManager, vault, voting);
        return (dao, vault, voting);
    }

    // function createTPSApps(
    //     Kernel dao,
    //     MiniMeToken token,
    //     Vault vault,
    //     Voting voting
    //     )
    //     internal
    //     // returns ()
    //         // AddressBook addressBook,
    //         // Allocations allocations,
    //         // Projects projects,
    //         // RangeVoting rangeVoting
    //         // Rewards rewards
    //     // )
    // {
    //     ACL acl = ACL(dao.acl());

    //     AddressBook addressBook = AddressBook(
    //         dao.newAppInstance(
    //             planningAppIds[uint8(PlanningApps.AddressBook)],
    //             latestVersionAppBase(planningAppIds[uint8(PlanningApps.AddressBook)])
    //         )
    //     );
    //     emit InstalledApp(addressBook, planningAppIds[uint8(PlanningApps.AddressBook)]);

    //     Allocations allocations = Allocations(
    //         dao.newAppInstance(
    //             planningAppIds[uint8(PlanningApps.Allocations)],
    //             latestVersionAppBase(planningAppIds[uint8(PlanningApps.Allocations)])
    //         )
    //     );
    //     emit InstalledApp(allocations, planningAppIds[uint8(PlanningApps.Allocations)]);

    //     Projects projects = Projects(
    //         dao.newAppInstance(
    //             planningAppIds[uint8(PlanningApps.Projects)],
    //             latestVersionAppBase(planningAppIds[uint8(PlanningApps.Projects)])
    //         )
    //     );
    //     emit InstalledApp(projects, planningAppIds[uint8(PlanningApps.Projects)]);

    //     RangeVoting rangeVoting = RangeVoting(
    //         dao.newAppInstance(
    //             planningAppIds[uint8(PlanningApps.RangeVoting)],
    //             latestVersionAppBase(planningAppIds[uint8(PlanningApps.RangeVoting)])
    //         )
    //     );
    //     emit InstalledApp(rangeVoting, planningAppIds[uint8(PlanningApps.RangeVoting)]);

    //     // rewards = Rewards(
    //     //     dao.newAppInstance(
    //     //         planningAppIds[uint8(PlanningApps.Rewards)],
    //     //         latestVersionAppBase(planningAppIds[uint8(PlanningApps.Rewards)])
    //     //     )
    //     // );
    //     // emit InstalledApp(rewards, planningAppIds[uint8(PlanningApps.Rewards)]);

    //     // Handle permissions creation
    //     // acl.createPermission(this, dao, dao.APP_MANAGER_ROLE(), this);
    //     handleTPSPermissions(dao, addressBook, allocations, projects, rangeVoting, /*rewards,*/ voting);
    //     handleVaultPermissions(acl, projects, /*rewards,*/ vault);

    //     // Initialize the Planning Suite apps
    //     initTPSApps(addressBook, allocations, projects, rangeVoting, /*rewards,*/ token, vault);
    // }

    // function handleTPSPermissions(
    //     Kernel dao,
    //     AddressBook addressBook,
    //     Allocations allocations,
    //     Projects projects,
    //     RangeVoting rangeVoting,
    //     // Rewards rewards,
    //     Voting voting
    //     ) internal
    // {
    //     ACL acl = ACL(dao.acl());
    //     address root = msg.sender;

    //     // AddressBook permissions:
    //     acl.createPermission(ANY_ENTITY, addressBook, addressBook.ADD_ENTRY_ROLE(), root);
    //     acl.createPermission(ANY_ENTITY, addressBook, addressBook.REMOVE_ENTRY_ROLE(), root);

    //     // // Projects permissions:
    //     // acl.createPermission(voting, projects, projects.ADD_BOUNTY_ROLE(), root);
    //     // acl.createPermission(ANY_ENTITY, projects, projects.ADD_REPO_ROLE(), root);
    //     // // acl.createPermission(ANY_ENTITY, projects, projects.CHANGE_SETTINGS_ROLE(), root);
    //     // acl.createPermission(rangeVoting, projects, projects.CURATE_ISSUES_ROLE(), root);
    //     // // acl.createPermission(ANY_ENTITY, projects, projects.REMOVE_REPO_ROLE(), root);
    //     // // acl.createPermission(ANY_ENTITY, projects, projects.TASK_ASSIGNMENT_ROLE(), root);
    //     // acl.createPermission(ANY_ENTITY, projects, projects.WORK_REVIEW_ROLE(), root);

    //     // Range-voting permissions
    //     acl.createPermission(ANY_ENTITY, rangeVoting, rangeVoting.CREATE_VOTES_ROLE(), root);
    //     acl.createPermission(ANY_ENTITY, rangeVoting, rangeVoting.ADD_CANDIDATES_ROLE(), root);
    //     acl.createPermission(ANY_ENTITY, rangeVoting, rangeVoting.MODIFY_PARTICIPATION_ROLE(), root);

    //     // Allocations permissions:
    //     // acl.createPermission(ANY_ENTITY, allocations, allocations.START_PAYOUT_ROLE(), root);
    //     // acl.createPermission(rangeVoting, allocations, allocations.SET_DISTRIBUTION_ROLE(), root);
    //     // acl.createPermission(ANY_ENTITY, allocations, allocations.EXECUTE_PAYOUT_ROLE(), root);

    //     // Rewards Permissions
    //     // acl.createPermission(ANY_ENTITY, rewards, rewards.ADD_REWARD_ROLE(), root);
    // }

    // function handleVaultPermissions(ACL acl, Projects projects, /*Rewards rewards,*/ Vault vault) internal {
    //     // Vault permissions
    //     acl.grantPermission(projects, vault, vault.TRANSFER_ROLE());
    //     // acl.grantPermission(rewards, vault, vault.TRANSFER_ROLE());
    // }

    // function initTPSApps(
    //     AddressBook addressBook,
    //     Allocations allocations,
    //     Projects projects,
    //     RangeVoting rangeVoting,
    //     // Rewards rewards,
    //     MiniMeToken token,
    //     Vault vault
    //     ) internal
    // {
    //     addressBook.initialize();
    //     // projects.initialize(registry, vault);
    //     // rangeVoting.initialize(addressBook, token, 50 * PCT256, 0, 1 minutes);
    //     // allocations.initialize(addressBook);
    //     // rewards.initialize(vault);
    // }

    // function doCleanup(Kernel dao, Voting voting) internal {
    //     ACL acl = ACL(dao.acl());
    //     cleanupPermission(acl, voting, dao, dao.APP_MANAGER_ROLE());
        
    // }
}
