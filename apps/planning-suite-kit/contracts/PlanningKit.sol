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

        StandardBounties registry = StandardBounties(root);

        // bytes32 votingAppId = apmNamehash("voting");
        // bytes32 tokenManagerAppId = apmNamehash("token-manager");


        bytes32[5] memory apps = [
            apmNamehash("address-book"),    // 0
            apmNamehash("projects"),        // 1
            apmNamehash("range-voting"),    // 2
            apmNamehash("allocations"),     // 3
            apmNamehash("token-manager")    // 4
        ];

        // Planning Apps
        AddressBook addressBook = AddressBook(dao.newAppInstance(apps[0], latestVersionAppBase(apps[0])));
        Projects projects = Projects(dao.newAppInstance(apps[1], latestVersionAppBase(apps[1])));
        RangeVotingApp rangeVoting = RangeVotingApp(dao.newAppInstance(apps[2], latestVersionAppBase(apps[2])));
        Allocations allocations = Allocations(dao.newAppInstance(apps[3], latestVersionAppBase(apps[3])));
        // Aragon Apps
        TokenManager tokenManager = TokenManager(dao.newAppInstance(apps[4], latestVersionAppBase(apps[4])));
        // Voting voting = Voting(dao.newAppInstance(votingAppId, latestVersionAppBase(votingAppId)));
        // // Survey survey = Survey(dao.newAppInstance(apps[6], latestVersionAppBase(apps[6])));

        // MiniMe Token
        MiniMeToken token = tokenFactory.createCloneToken(MiniMeToken(0), 0, "Autark Token", 0, "autark", true);
        token.generateTokens(address(root), 100); // give root 100 autark tokens
        token.changeController(tokenManager);

        // Initialize apps
        addressBook.initialize();
        projects.initialize(registry);
        rangeVoting.initialize(token, 50 * PCT, 0, 1 minutes);
        allocations.initialize(addressBook);
        tokenManager.initialize(token, true, 0);
        // voting.initialize(token, 50 * PCT, 20 * PCT, 10 minutes);
        // // At least 50% of the voting tokens must vote, there is no minimum
        // // candidate support, and the vote will last 1 minute for testing.
        // // survey.initialize(token, uint64(20 * PCT), uint64(10 minutes));
        

        // AddressBook permissions:
        acl.createPermission(ANY_ENTITY, addressBook, addressBook.ADD_ENTRY_ROLE(), root);
        acl.createPermission(ANY_ENTITY, addressBook, addressBook.REMOVE_ENTRY_ROLE(), root);
        // emit InstalledApp(addressBook, addressBookAppId);


        // Projects permissions:
        acl.createPermission(ANY_ENTITY, projects, projects.ADD_BOUNTY_ROLE(), root);
        acl.createPermission(ANY_ENTITY, projects, projects.ADD_REPO_ROLE(), root);
        acl.createPermission(ANY_ENTITY, projects, projects.CHANGE_SETTINGS_ROLE(), root);
        acl.createPermission(rangeVoting, projects, projects.CURATE_ISSUES_ROLE(), root);
        acl.createPermission(ANY_ENTITY, projects, projects.REMOVE_REPO_ROLE(), root);
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
        // tokenManager.mint(root, 1); // Give one token to root
        // emit InstalledApp(tokenManager, );

        // survey permissions
        // Set survey manager as the entity that can create votes and change participation
        // surveyManager can then give this permission to other entities
        // acl.createPermission(ANY_ENTITY, survey, survey.CREATE_SURVEYS_ROLE(), root);
        // acl.createPermission(ANY_ENTITY, survey, survey.MODIFY_PARTICIPATION_ROLE(), root);

        // // acl.grantPermission(surveyManager, dao, dao.APP_MANAGER_ROLE());
        // // acl.setPermissionManager(surveyManager, dao, dao.APP_MANAGER_ROLE());
        // emit InstalledApp(tokenManager, apps[5]);

        // Voting permissions
        // acl.createPermission(ANY_ENTITY, voting, voting.CREATE_VOTES_ROLE(), root);

        // Clean up template permissions
        // acl.grantPermission(voting, tokenManager, tokenManager.MINT_ROLE());
        acl.grantPermission(root, dao, dao.APP_MANAGER_ROLE());
        acl.revokePermission(this, dao, dao.APP_MANAGER_ROLE());
        acl.setPermissionManager(root, dao, dao.APP_MANAGER_ROLE());

        acl.grantPermission(root, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.revokePermission(this, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.setPermissionManager(root, acl, acl.CREATE_PERMISSIONS_ROLE());

        emit DeployInstance(dao);
    }
}
