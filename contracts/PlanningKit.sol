pragma solidity 0.4.18;

import "@aragon/os/contracts/factory/DAOFactory.sol";
import "@aragon/os/contracts/apm/Repo.sol";
import "@aragon/os/contracts/lib/ens/ENS.sol";
import "@aragon/os/contracts/lib/ens/PublicResolver.sol";
import "@aragon/os/contracts/apm/APMNamehash.sol";

import "@aragon/apps-voting/contracts/Voting.sol";
import "@aragon/apps-token-manager/contracts/TokenManager.sol";
import "@aragon/os/contracts/lib/minime/MiniMeToken.sol";

import "../apps/address-book/contracts/AddressBook.sol";
import "../apps/allocations/contracts/Allocations.sol";
import "../apps/projects/contracts/Projects.sol";
import "../apps/range-voting/contracts/RangeVoting.sol";

contract KitBase is APMNamehash {
    ENS public ens;
    DAOFactory public fac;

    event DeployInstance(address dao);
    event InstalledApp(address appProxy, bytes32 appId);

    function KitBase(DAOFactory _fac, ENS _ens) public {
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
        (,base,) = repo.getLatest();

        return base;
    }
}

contract PlanningKit is KitBase {
    MiniMeTokenFactory tokenFactory;

    uint256 constant PCT = 10 ** 16;
    address constant ANY_ENTITY = address(-1);

    function PlanningKit(ENS ens) KitBase(DAOFactory(0), ens) public {
        tokenFactory = new MiniMeTokenFactory();
    }

    function newInstance() public {
        Kernel dao = fac.newDAO(this);
        ACL acl = ACL(dao.acl());
        acl.createPermission(this, dao, dao.APP_MANAGER_ROLE(), this);

        address root = msg.sender;
        bytes32 allocationsId = apmNamehash("allocations");
        bytes32 addressBookId = apmNamehash("address-book");
        bytes32 projectsId = apmNamehash("projects");
        bytes32 rangeVotingId = apmNamehash("range-voting");

        bytes32 votingAppId = apmNamehash("voting");
        bytes32 tokenManagerAppId = apmNamehash("token-manager");

        // Planning Apps
        Allocations allocations = Allocations(dao.newAppInstance(allocationsId, latestVersionAppBase(allocationsId)));
        AddressBook addressBook = AddressBook(dao.newAppInstance(addressBookId, latestVersionAppBase(addressBookId)));
        Projects projects = Prokects(dao.newAppInstance(projectsId, latestVersionAppBase(projectsId)));
        RangeVoting rangeVoting = RangeVoting(dao.newAppInstance(rangeVotingId, latestVersionAppBase(rangeVotingId)));

        // Aragon Apps
        Voting voting = Voting(dao.newAppInstance(votingAppId, latestVersionAppBase(votingAppId)));
        TokenManager tokenManager = TokenManager(dao.newAppInstance(tokenManagerAppId, latestVersionAppBase(tokenManagerAppId)));

        // MiniMe Token
        MiniMeToken token = tokenFactory.createCloneToken(address(0), 0, "App token", 0, "APP", true);
        token.changeController(tokenManager);

        // Initialize apps
        tokenManager.initialize(token, true, 0, true);
        voting.initialize(token, 50 * PCT, 20 * PCT, 1 days);

        // TokenManager permissions
        acl.createPermission(this, tokenManager, tokenManager.MINT_ROLE(), this);
        acl.grantPermission(voting, tokenManager, tokenManager.MINT_ROLE());
        tokenManager.mint(root, 1); // Give one token to root

        // Voting permissions
        acl.createPermission(ANY_ENTITY, voting, voting.CREATE_VOTES_ROLE(), root);

        // Allocations permissions:
        acl.createPermission(voting, allocations, allocations.START_PAYOUT_ROLE(), root);
        acl.createPermission(voting, allocations, allocations.SET_DISTRIBUTION_ROLE(), root);
        acl.createPermission(voting, allocations, allocations.EXECUTE_PAYOUT_ROLE(), root);

        // AddressBook permissions:
        acl.createPermission(voting, addressBook, addressBook.ADD_ENTRY_ROLE(), root);
        acl.createPermission(voting, addressBook, addressBook.REMOVE_ENTRY_ROLE(), root);

        // Projects permissions:
        acl.createPermission(voting, projects, projects.ADD_ENTRY_ROLE(), root);
        acl.createPermission(voting, projects, projects.REMOVE_ENTRY_ROLE(), root);
        acl.createPermission(voting, projects, projects.ADD_BOUNTY_ROLE(), root);

        // Range-voting permissions
        acl.createPermission(ANY_ENTITY, rangeVoting, rangeVoting.CREATE_VOTES_ROLE(), voting);
        acl.createPermission(ANY_ENTITY, rangeVoting, rangeVoting.ADD_CANDIDATES_ROLE(), root);
        acl.createPermission(voting, rangeVoting, rangeVoting.MODIFY_PARTICIPATION_ROLE(), root);
        
        // Clean up template permissions
        acl.grantPermission(root, dao, dao.APP_MANAGER_ROLE());
        acl.revokePermission(this, dao, dao.APP_MANAGER_ROLE());
        acl.setPermissionManager(root, dao, dao.APP_MANAGER_ROLE());

        acl.grantPermission(root, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.revokePermission(this, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.setPermissionManager(root, acl, acl.CREATE_PERMISSIONS_ROLE());

        DeployInstance(dao);
    }
}
