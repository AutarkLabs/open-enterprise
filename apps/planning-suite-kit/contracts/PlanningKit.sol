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
import {RangeVoting as RangeVotingApp} from "@tps/apps-range-voting/contracts/RangeVoting.sol";
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
}


contract PlanningKit is KitBase {
    MiniMeTokenFactory tokenFactory;
    StandardBounties registry;

    uint256 constant PCT256 = 10 ** 16;
    uint64 constant PCT64 = 10 ** 16;
    address constant ANY_ENTITY = address(-1);

    constructor(ENS ens) public KitBase(DAOFactory(0), ens) {
        address root = msg.sender;
        
        tokenFactory = new MiniMeTokenFactory();
        registry = new StandardBounties(root);

    }

    function newInstance() public {
        Kernel dao = fac.newDAO(this);
        ACL acl = ACL(dao.acl());

        bytes32 appManagerRole = dao.APP_MANAGER_ROLE();
        acl.createPermission(this, dao, appManagerRole, this);
        address root = msg.sender;
        AddressBook addressBook;
        Projects projects;
        RangeVotingApp rangeVoting;
        Allocations allocations;
        TokenManager tokenManager;
        Vault vault;
        Finance finance;
        MiniMeToken token;
        Voting voting;

        (addressBook, projects, rangeVoting, allocations) = createTPSApps(dao);
        (tokenManager, vault, finance, token, voting) = createA1Apps(dao);
        token.generateTokens(address(root), 200 ether); // give root 100 autark tokens
        token.generateTokens(address(this), 100 ether); // give root 100 autark tokens
        token.changeController(tokenManager);

        // Initialize apps
        vault.initialize();
        addressBook.initialize();
        projects.initialize(registry, vault);
        rangeVoting.initialize(token, 50 * PCT256, 0, 1 minutes);
        voting.initialize(token, 50 * PCT64, 10 * PCT64, 1 days);
        allocations.initialize(addressBook);
        tokenManager.initialize(token, true, 0);
        finance.initialize(vault, 1 days);
        token.approve(finance, 100 ether);
        finance.deposit(token, 100 ether, "Initial token transfer");

        handlePermissions(
            dao,
            acl,
            root, 
            addressBook, 
            projects, 
            rangeVoting, 
            allocations, 
            tokenManager, 
            vault, 
            finance,
            voting
        );

        emit DeployInstance(dao);
    }

    function createTPSApps (Kernel dao) internal returns(
        AddressBook addressBook,
        Projects projects,
        RangeVotingApp rangeVoting,
        Allocations allocations
    )
    {

        bytes32[4] memory apps = [
            apmNamehash("address-book"),    // 0
            apmNamehash("projects"),        // 1
            apmNamehash("range-voting"),    // 2
            apmNamehash("allocations")     // 3
        ];

        // Planning Apps
        addressBook = AddressBook(dao.newAppInstance(apps[0], latestVersionAppBase(apps[0])));
        projects = Projects(dao.newAppInstance(apps[1], latestVersionAppBase(apps[1])));
        rangeVoting = RangeVotingApp(dao.newAppInstance(apps[2], latestVersionAppBase(apps[2])));
        allocations = Allocations(dao.newAppInstance(apps[3], latestVersionAppBase(apps[3])));

    }

    function createA1Apps (Kernel dao) internal returns(
        TokenManager tokenManager,
        Vault vault,
        Finance finance,
        MiniMeToken token,
        Voting voting
    )
    {
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
        token = tokenFactory.createCloneToken(MiniMeToken(0), 0, "Autark Token", 18, "autark", true);
    }

    function handlePermissions(
        Kernel dao,
        ACL acl,
        address root,
        AddressBook addressBook,
        Projects projects,
        RangeVotingApp rangeVoting,
        Allocations allocations,
        TokenManager tokenManager,
        Vault vault,
        Finance finance,
        Voting voting
    ) internal
    {

        bytes32 appManagerRole = dao.APP_MANAGER_ROLE();

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

        // Token Manager permissions
        acl.createPermission(projects, vault, vault.TRANSFER_ROLE(), root);

        // Voting Permissions
        acl.createPermission(ANY_ENTITY, voting, voting.CREATE_VOTES_ROLE(), root);
        acl.createPermission(ANY_ENTITY, voting, voting.MODIFY_SUPPORT_ROLE(), root);
        acl.createPermission(ANY_ENTITY, voting, voting.MODIFY_QUORUM_ROLE(), root);

        // Clean up template permissions
        acl.grantPermission(root, dao, appManagerRole);
        acl.revokePermission(this, dao, appManagerRole);
        acl.setPermissionManager(root, dao, appManagerRole);

        acl.grantPermission(root, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.revokePermission(this, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.setPermissionManager(root, acl, acl.CREATE_PERMISSIONS_ROLE());

    }
}
