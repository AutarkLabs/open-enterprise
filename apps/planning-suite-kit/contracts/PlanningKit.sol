pragma solidity ^0.4.24;

// /*
//     Kits work:
//     https://github.com/aragon/aragen/pull/15
//     https://github.com/aragon/dao-kits/tree/tcr_deferred_lock
//     https://github.com/aragon/dao-kits/blob/2316fd7c591812bc9a72787bdd6f219b0c654c8e/kits/dev/contracts/DevTemplate.sol
//     https://github.com/aragon/aragen/blob/master/scripts/deploy-base

// */

import "@tps/test-helpers/contracts/factory/DAOFactory.sol";
import "@tps/test-helpers/contracts/apm/Repo.sol";
import "@tps/test-helpers/contracts/lib/ens/ENS.sol";
import "@tps/test-helpers/contracts/lib/ens/PublicResolver.sol";
import "@tps/test-helpers/contracts/apm/APMNamehash.sol";
import "@tps/test-helpers/contracts/lib/minime/MiniMeToken.sol";

import "@tps/test-helpers/contracts/apps/Voting.sol"; /* Already defined in ACLHelper */
//import {TokenManager as TokenManagerApp} from "@aragon/apps-token-manager/contracts/TokenManager.sol"; /* Already defined in EVMScriptRunner */
// import "@tps/test-helpers/contracts/lib/minime/MiniMeToken.sol"; // TODO: use this 

import {Allocations as AllocationsApp} from "@tps/apps-allocations/contracts/Allocations.sol";
import {Projects as ProjectsApp} from "@tps/apps-projects/contracts/Projects.sol";
import {RangeVoting as RangeVotingApp} from "@tps/apps-range-voting/contracts/RangeVoting.sol";


contract KitBase is APMNamehash {
    ENS public ens;
    DAOFactory public fac;

    event DeployInstance(address dao);
    event InstalledApp(address appProxy, bytes32 appId);

    // enum Apps { TokenManager, Voting } should we declare this?
    // probably useful if splitting functions have contract scope apps

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

    uint256 constant PCT = 10 ** 16;
    address constant ANY_ENTITY = address(-1);

    constructor(ENS ens) public KitBase(DAOFactory(0), ens) {
        tokenFactory = new MiniMeTokenFactory();
    }

    function newInstance() public {
        Kernel dao = fac.newDAO(this);
        ACL acl = ACL(dao.acl());
        acl.createPermission(this, dao, dao.APP_MANAGER_ROLE(), this);

        address root = msg.sender;
        
        // TODO: Try a mix between:
        // https://github.com/aragon/dao-kits/blob/tcr_deferred_lock/kits/tcr/contracts/TCRKit.sol
        // https://github.com/aragon/dao-kits/blob/tcr_deferred_lock/kits/beta/test/beta.js
        // https://github.com/aragon/dao-kits/blob/tcr_deferred_lock/kits/payroll/contracts/PayrollKit.sol
        // https://github.com/aragon/dao-kits/blob/2316fd7c591812bc9a72787bdd6f219b0c654c8e/kits/beta/contracts/BetaTemplateBase.sol
    
        /* 
        Aragon will release the App
        MarketPlace at some moment
        */

        // nasty hack to trick the max vars limit error
        bytes32[6] memory apps = [
            apmNamehash("allocations"),     // 0
            apmNamehash("address-book"),    // 1
            apmNamehash("projects"),        // 2
            apmNamehash("range-voting"),    // 3
            apmNamehash("token-manager"),   // 4
            apmNamehash("voting")           // 5
        ];

        // Planning Apps
        AllocationsApp allocations = AllocationsApp(dao.newAppInstance(apps[0], latestVersionAppBase(apps[0])));
        //AddressBookApp addressBook = AddressBookApp(dao.newAppInstance(apps[1], latestVersionAppBase(apps[1])));
        ProjectsApp projects = ProjectsApp(dao.newAppInstance(apps[2], latestVersionAppBase(apps[2])));
        RangeVotingApp rangeVoting = RangeVotingApp(dao.newAppInstance(apps[3], latestVersionAppBase(apps[3])));
        // Aragon Apps
        //TokenManagerApp tokenManager = TokenManagerApp(dao.newAppInstance(apps[4], latestVersionAppBase(apps[4])));
        //Voting voting = Voting(dao.newAppInstance(apps[5], latestVersionAppBase(apps[5])));

        // MiniMe Token
        MiniMeToken token = tokenFactory.createCloneToken(token, 0, "App token", 0, "APP", true);
        token.generateTokens(address(0xb4124cEB3451635DAcedd11767f004d8a28c6eE7), 1 ether);
        //token.changeController(tokenManager);

        // Initialize apps
        allocations.initialize();
        // TODO: Enable when code is ready in the apps
        // addressBook.initialize();
        projects.initialize();
        //tokenManager.initialize(token, true, 0);
        //voting.initialize(token, 50 * PCT, 20 * PCT, 1 days);
        rangeVoting.initialize(token, 50 * PCT, 20 * PCT, 1 minutes);
        

        // Allocations permissions:
        acl.createPermission(ANY_ENTITY, allocations, allocations.START_PAYOUT_ROLE(), root);
        acl.createPermission(rangeVoting, allocations, allocations.SET_DISTRIBUTION_ROLE(), root);
        acl.createPermission(ANY_ENTITY, allocations, allocations.EXECUTE_PAYOUT_ROLE(), root);
        emit InstalledApp(allocations, apps[0]);

        // AddressBook permissions:
        /*
        acl.createPermission(voting, addressBook, addressBook.ADD_ENTRY_ROLE(), root);
        acl.createPermission(voting, addressBook, addressBook.REMOVE_ENTRY_ROLE(), root);
        emit InstalledApp(addressBook, apps[1]);
        */
        // Projects permissions:
        acl.createPermission(ANY_ENTITY, projects, projects.ADD_REPO_ROLE(), root);
        acl.createPermission(ANY_ENTITY, projects, projects.REMOVE_REPO_ROLE(), root);
        acl.createPermission(ANY_ENTITY, projects, projects.ADD_BOUNTY_ROLE(), root);
        emit InstalledApp(projects, apps[2]);

        // Range-voting permissions
        acl.createPermission(ANY_ENTITY, rangeVoting, rangeVoting.CREATE_VOTES_ROLE(), root);
        acl.createPermission(ANY_ENTITY, rangeVoting, rangeVoting.ADD_CANDIDATES_ROLE(), root);
        acl.createPermission(ANY_ENTITY, rangeVoting, rangeVoting.MODIFY_PARTICIPATION_ROLE(), root);
        emit InstalledApp(rangeVoting, apps[3]);

        /* TokenManager permissions
        acl.createPermission(voting, tokenManager, tokenManager.ASSIGN_ROLE(), voting);
        acl.createPermission(voting, tokenManager, tokenManager.REVOKE_VESTINGS_ROLE(), voting);
        // acl.grantPermission(voting, tokenManager, tokenManager.MINT_ROLE()); // TODO: Causes VM revert
        acl.createPermission(this, tokenManager, tokenManager.MINT_ROLE(), this);
        tokenManager.mint(root, 1); // Give one token to root
        emit InstalledApp(tokenManager, apps[4]);
        */
        
        // Voting permissions
        //acl.createPermission(ANY_ENTITY, voting, voting.CREATE_VOTES_ROLE(), root);


        // Clean up template permissions
        acl.grantPermission(root, dao, dao.APP_MANAGER_ROLE());
        acl.revokePermission(this, dao, dao.APP_MANAGER_ROLE());
        acl.setPermissionManager(root, dao, dao.APP_MANAGER_ROLE());

        acl.grantPermission(root, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.revokePermission(this, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.setPermissionManager(root, acl, acl.CREATE_PERMISSIONS_ROLE());

        emit DeployInstance(dao);
    }
}
