pragma solidity 0.4.24;

import "@aragon/os/contracts/factory/DAOFactory.sol";
import "@aragon/os/contracts/apm/Repo.sol";
import "@aragon/os/contracts/lib/ens/ENS.sol";
import "@aragon/os/contracts/lib/ens/PublicResolver.sol";
import "@aragon/os/contracts/apm/APMNamehash.sol";

// import "@aragon/apps-voting/contracts/Voting.sol";
import "@aragon/apps-token-manager/contracts/TokenManager.sol";
import "@aragon/apps-shared-minime/contracts/MiniMeToken.sol";
// import "@aragon/apps-survey/contracts/Survey.sol";

import "@tps/apps-address-book/contracts/AddressBook.sol";
import "@tps/apps-allocations/contracts/Allocations.sol";
import "@tps/apps-projects/contracts/Projects.sol";
import {DotVoting as DotVotingApp} from "@tps/apps-dot-voting/contracts/DotVoting.sol";
import "@tps/apps-rewards/contracts/Rewards.sol";
import "@tps/test-helpers/contracts/lib/bounties/StandardBounties.sol";
import "@aragon/apps-vault/contracts/Vault.sol";
import "@aragon/apps-finance/contracts/Finance.sol";
import "@aragon/apps-voting/contracts/Voting.sol";



contract KitBase is APMNamehash {
    ENS public ens;
    DAOFactory public fac;

    event DeployInstance(address dao);
    event InstalledApp(address appProxy, bytes32 appId);

    constructor(DAOFactory _fac, ENS _ens) public {
        ens = _ens;

        // If no factory is passed, get it from on-chain bare-kit
        if (address(_fac) == address(0)) {
            bytes32 bareKit = apmNamehash("bare-kit");
            fac = KitBase(latestVersionAppBase(bareKit)).fac();
        } else {
            fac = _fac;
        }
    }

    function latestVersionAppBase(bytes32 appId) public view returns (address base) {
        Repo repo = Repo(PublicResolver(ens.resolver(appId)).addr(appId));
        (, base, ) = repo.getLatest();

        return base;
    }

    function cleanupDAOPermissions(Kernel dao, ACL acl, address root) internal {
        // Kernel permission clean up
        cleanupPermission(acl, root, dao, dao.APP_MANAGER_ROLE());

        // ACL permission clean up
        cleanupPermission(acl, root, acl, acl.CREATE_PERMISSIONS_ROLE());
    }

    function cleanupPermission(ACL acl, address root, address app, bytes32 permission) internal {
        acl.grantPermission(root, app, permission);
        acl.revokePermission(this, app, permission);
        acl.setPermissionManager(root, app, permission);
    }
}


contract PlanningKit is KitBase {
    MiniMeTokenFactory tokenFactory;
    MiniMeToken token;
    StandardBounties registry;

    uint256 constant PCT256 = 10 ** 16;
    uint64 constant PCT64 = 10 ** 16;
    address constant ANY_ENTITY = address(-1);
    constructor(ENS ens) public KitBase(DAOFactory(0), ens) {
        address root = msg.sender;

        tokenFactory = new MiniMeTokenFactory();
        token = tokenFactory.createCloneToken(MiniMeToken(0), 0, "Autark Token", 18, "autark", true);
        // Generate Tokens
        token.generateTokens(address(root), 200 ether); // give root 100 autark tokens
        token.generateTokens(address(this), 100 ether); // give root 100 autark tokens
        registry = new StandardBounties(root);
    }

    function newInstance() public {
        Kernel dao = fac.newDAO(this);
        ACL acl = ACL(dao.acl());

        bytes32 appManagerRole = dao.APP_MANAGER_ROLE();
        acl.createPermission(this, dao, appManagerRole, this);
        address root = msg.sender;
        Vault vault;
        Voting voting;

        (vault, voting) = createA1Apps(root, acl, dao);

        createTPSApps(root, dao, vault, voting);

        //handleCleanupPermissions(dao, acl, root);

        emit DeployInstance(dao);
    }

    function createA1Apps(address root, ACL acl, Kernel dao) internal returns(
        Vault vault,
        Voting voting
    )
    {
        TokenManager tokenManager;
        Finance finance;
        bytes32[4] memory apps = [
            apmNamehash("token-manager"),   // 0
            apmNamehash("vault"),           // 1
            apmNamehash("finance"),         // 2
            apmNamehash("voting")           // 3
        ];

        // Aragon Apps
        tokenManager = TokenManager(dao.newAppInstance(apps[0], latestVersionAppBase(apps[0])));
        vault = Vault(dao.newAppInstance(apps[1], latestVersionAppBase(apps[1])));
        finance = Finance(dao.newAppInstance(apps[2], latestVersionAppBase(apps[2])));
        voting = Voting(dao.newAppInstance(apps[3], latestVersionAppBase(apps[3])));

        // MiniMe Token
        initializeA1Apps(root, tokenManager, vault, finance, voting);
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
        Voting voting
    ) internal
    {

        token.changeController(tokenManager);
        // Initialize A1 apps
        tokenManager.initialize(token, true, 0);
        vault.initialize();
        finance.initialize(vault, 1 days);
        token.approve(finance, 100 ether);
        voting.initialize(token, 50 * PCT64, 10 * PCT64, 1 days);
        finance.deposit(token, 50 ether, "Initial token transfer pt 1");
        finance.deposit(token, 50 ether, "Initial token transfer pt 2");
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
        acl.createPermission(ANY_ENTITY, tokenManager, tokenManager.MINT_ROLE(), this);
        acl.createPermission(ANY_ENTITY, tokenManager, tokenManager.ISSUE_ROLE(), root);
        acl.createPermission(ANY_ENTITY, tokenManager, tokenManager.ASSIGN_ROLE(), root);
        acl.createPermission(ANY_ENTITY, tokenManager, tokenManager.REVOKE_VESTINGS_ROLE(), root);

        // Finance permissions
        acl.createPermission(ANY_ENTITY, finance, finance.CREATE_PAYMENTS_ROLE(), root);
        acl.createPermission(ANY_ENTITY, finance, finance.CHANGE_PERIOD_ROLE(), root);
        acl.createPermission(ANY_ENTITY, finance, finance.CHANGE_BUDGETS_ROLE(), root);
        acl.createPermission(ANY_ENTITY, finance, finance.EXECUTE_PAYMENTS_ROLE(), root);
        acl.createPermission(ANY_ENTITY, finance, finance.MANAGE_PAYMENTS_ROLE(), root);

        // Voting Permissions
        acl.createPermission(ANY_ENTITY, voting, voting.CREATE_VOTES_ROLE(), root);
        acl.createPermission(ANY_ENTITY, voting, voting.MODIFY_SUPPORT_ROLE(), root);
        acl.createPermission(ANY_ENTITY, voting, voting.MODIFY_QUORUM_ROLE(), root);

    }

    function createTPSApps (address root, Kernel dao, Vault vault, Voting voting) internal {
        AddressBook addressBook;
        Projects projects;
        DotVotingApp dotVoting;
        Allocations allocations;
        Rewards rewards;


        bytes32[5] memory apps = [
            apmNamehash("address-book"),    // 0
            apmNamehash("projects"),        // 1
            apmNamehash("dot-voting"),    // 2
            apmNamehash("allocations"),     // 3
            apmNamehash("rewards")          // 4
        ];

        // Planning Apps
        addressBook = AddressBook(dao.newAppInstance(apps[0], latestVersionAppBase(apps[0])));
        projects = Projects(dao.newAppInstance(apps[1], latestVersionAppBase(apps[1])));
        dotVoting = DotVotingApp(dao.newAppInstance(apps[2], latestVersionAppBase(apps[2])));
        allocations = Allocations(dao.newAppInstance(apps[3], latestVersionAppBase(apps[3])));
        rewards = Rewards(dao.newAppInstance(apps[4], latestVersionAppBase(apps[4])));
        initializeTPSApps(addressBook, projects, dotVoting, allocations, rewards, vault);
        handleTPSPermissions(
            dao,
            addressBook,
            projects,
            dotVoting,
            allocations,
            rewards,
            voting
        );
        handleVaultPermissions(
            dao,
            projects,
            allocations,
            rewards,
            vault
        );

    }

    function initializeTPSApps(
        AddressBook addressBook,
        Projects projects,
        DotVotingApp dotVoting,
        Allocations allocations,
        Rewards rewards,
        Vault vault
    ) internal
    {
        address root = msg.sender;
        addressBook.initialize();
        projects.initialize(registry, vault, token);
        dotVoting.initialize(addressBook, token, 50 * PCT256, 0, 1 minutes);
        allocations.initialize(addressBook, vault);
        rewards.initialize(vault);
    }

    function handleTPSPermissions(
        Kernel dao,
        AddressBook addressBook,
        Projects projects,
        DotVotingApp dotVoting,
        Allocations allocations,
        Rewards rewards,
        Voting voting
    ) internal
    {
        address root = msg.sender;
        ACL acl = ACL(dao.acl());

        // AddressBook permissions:
        acl.createPermission(voting, addressBook, addressBook.ADD_ENTRY_ROLE(), voting);
        acl.createPermission(voting, addressBook, addressBook.REMOVE_ENTRY_ROLE(), voting);
        //emit InstalledApp(addressBook, planningAppIds[uint8(PlanningApps.AddressBook)]);


        // Projects permissions:
        acl.createPermission(root, projects, projects.FUND_ISSUES_ROLE(), voting);
        acl.createPermission(voting, projects, projects.ADD_REPO_ROLE(), voting);
        acl.createPermission(voting, projects, projects.CHANGE_SETTINGS_ROLE(), voting);
        acl.createPermission(dotVoting, projects, projects.CURATE_ISSUES_ROLE(), voting);
        acl.createPermission(voting, projects, projects.REMOVE_REPO_ROLE(), voting);
        acl.createPermission(root, projects, projects.REVIEW_APPLICATION_ROLE(), voting);
        acl.createPermission(root, projects, projects.WORK_REVIEW_ROLE(), voting);
        //emit InstalledApp(projects, planningAppIds[uint8(PlanningApps.Projects)]);

        // Dot-voting permissions
        acl.createPermission(ANY_ENTITY, dotVoting, dotVoting.CREATE_VOTES_ROLE(), voting);
        acl.createPermission(ANY_ENTITY, dotVoting, dotVoting.ADD_CANDIDATES_ROLE(), voting);
        //emit InstalledApp(dotVoting, planningAppIds[uint8(PlanningApps.DotVoting)]);

        // Allocations permissions:
        acl.createPermission(voting, allocations, allocations.CREATE_ACCOUNT_ROLE(), voting);
        acl.createPermission(dotVoting, allocations, allocations.CREATE_ALLOCATION_ROLE(), voting);
        acl.createPermission(ANY_ENTITY, allocations, allocations.EXECUTE_ALLOCATION_ROLE(), voting);
        //emit InstalledApp(allocations, planningAppIds[uint8(PlanningApps.Allocations)]);

        // Rewards permissions:
        acl.createPermission(voting, rewards, rewards.ADD_REWARD_ROLE(), voting);
        //emit InstalledApp(rewards, planningAppIds[uint8(PlanningApps.Rewards)]);

    }

    function handleVaultPermissions(Kernel dao, Projects projects, Allocations allocations, Rewards rewards, Vault vault) internal {
        address root = msg.sender;

        ACL acl = ACL(dao.acl());
        // Vault permissions
        acl.createPermission(root, vault, vault.TRANSFER_ROLE(), this);
        acl.grantPermission(projects, vault, vault.TRANSFER_ROLE());
        acl.grantPermission(allocations, vault, vault.TRANSFER_ROLE());
        acl.grantPermission(rewards, vault, vault.TRANSFER_ROLE());
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
}
