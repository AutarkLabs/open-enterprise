pragma solidity 0.4.18;

import "@aragon/os/contracts/apm/APMRegistry.sol";
import "@aragon/os/contracts/factory/DAOFactory.sol";
import "@aragon/os/contracts/apm/Repo.sol";
import "@aragon/os/contracts/lib/ens/ENS.sol";
import "@aragon/os/contracts/lib/ens/PublicResolver.sol";
import "@aragon/os/contracts/apm/APMNamehash.sol";

import "@aragon/apps-voting/contracts/Voting.sol";
//import "@aragon/apps-vault/contracts/Vault.sol";
//import "@aragon/apps-finance/contracts/Finance.sol";
//import "@aragon/apps-vault/contracts/IVaultConnector.sol";
import "@aragon/apps-token-manager/contracts/TokenManager.sol";
import "@aragon/os/contracts/lib/minime/MiniMeToken.sol";

import "../../range-voting/contracts/RangeVoting.sol";
import "./Allocations.sol";

contract KitBase is APMNamehash {
    ENS public ens;
    DAOFactory public fac;

    event DeployInstance(address dao);
    event InstalledApp(address appProxy, bytes32 appId);

    enum Apps { TokenManager, Voting }

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

contract Kit is KitBase {
    MiniMeTokenFactory tokenFactory;

    uint256 constant PCT = 10 ** 16;
    address constant ANY_ENTITY = address(-1);

    function Kit(ENS ens) KitBase(DAOFactory(0), ens) public {
        tokenFactory = new MiniMeTokenFactory();
    }

    function newInstance() public {
        Kernel dao = fac.newDAO(this);
        ACL acl = ACL(dao.acl());
        acl.createPermission(this, dao, dao.APP_MANAGER_ROLE(), this);
        bytes32 allocationsAppId = apmNamehash("allocations");
        bytes32 rangeVoteAppId = apmNamehash("range-voting");
        bytes32 votingAppId = apmNamehash("voting");
        bytes32 tokenManagerAppId = apmNamehash("token-manager");
        //bytes32 vaultAppId = apmNamehash("vault");
        //bytes32 financeAppId = apmNamehash("finance");

        
        RangeVoting rangeVoting = RangeVoting(dao.newAppInstance(rangeVoteAppId, latestVersionAppBase(rangeVoteAppId)));
        Voting voting = Voting(dao.newAppInstance(votingAppId, latestVersionAppBase(votingAppId)));
        TokenManager tokenManager = TokenManager(dao.newAppInstance(tokenManagerAppId, latestVersionAppBase(tokenManagerAppId)));
        Allocations allocations = Allocations(dao.newAppInstance(allocationsAppId, latestVersionAppBase(allocationsAppId)));

        //Vault vault = Vault(dao.newAppInstance(vaultAppId, latestVersionAppBase(vaultAppId)));
        //Finance finance = Finance(dao.newAppInstance(financeAppId, latestVersionAppBase(financeAppId)));

        //InstalledApp(vault, vaultAppId);
        InstalledApp(rangeVoting, rangeVoteAppId);
        InstalledApp(voting, votingAppId);
        InstalledApp(tokenManager, tokenManagerAppId);
        //InstalledApp(allocations, allocationsAppId);


        MiniMeToken token = tokenFactory.createCloneToken(address(0), 0, "App token", 0, "APP", true);
        token.changeController(tokenManager);


        tokenManager.initialize(token, true, 0, true);
        // Initialize apps
        voting.initialize(token, 50 * PCT, 20 * PCT, 1 days);
        allocations.initialize();
        _setupPerms(acl, voting, tokenManager, rangeVoting, allocations);
        
        DeployInstance(dao);
    }

    function _setupPerms(ACL _acl, Voting _voting, TokenManager _tokenManager, RangeVoting _rangeVoting, Allocations _allocations) internal {
        address root = msg.sender;

        //Vault vaultBase = Vault(latestVersionAppBase(vaultAppId));
        // inits
        //vaultBase.initializeWithBase(vaultBase);
        //finance.initialize(IVaultConnector(vault), uint64(-1) - uint64(now)); // yuge period


        _acl.createPermission(ANY_ENTITY, _voting, _voting.CREATE_VOTES_ROLE(), root);

        //acl.createPermission(finance, vault, vault.TRANSFER_ROLE(), voting);
        //acl.createPermission(voting, finance, finance.CREATE_PAYMENTS_ROLE(), voting);
        //acl.createPermission(voting, finance, finance.EXECUTE_PAYMENTS_ROLE(), voting);
        //acl.createPermission(voting, finance, finance.DISABLE_PAYMENTS_ROLE(), voting);
        _acl.createPermission(_voting, _tokenManager, _tokenManager.ASSIGN_ROLE(), _voting);
        _acl.createPermission(_voting, _tokenManager, _tokenManager.REVOKE_VESTINGS_ROLE(), _voting);

        //acl.createPermission(finance, vault, vault.TRANSFER_ROLE(), voting);
        _acl.createPermission(_voting, _rangeVoting, _rangeVoting.CREATE_VOTES_ROLE(), _voting);
        _acl.createPermission(ANY_ENTITY, _rangeVoting, _rangeVoting.ADD_CANDIDATES_ROLE(), root);
        _acl.createPermission(_voting, _rangeVoting, _rangeVoting.MODIFY_PARTICIPATION_ROLE(), root);

        _acl.createPermission(ANY_ENTITY, _allocations, _allocations.START_PAYOUT_ROLE(), root);
        _acl.createPermission(_rangeVoting, _allocations, _allocations.SET_DISTRIBUTION_ROLE(), root);
        _acl.createPermission(_voting, _allocations, _allocations.EXECUTE_PAYOUT_ROLE(), root);

        /*

        acl.grantPermission(voting, tokenManager, tokenManager.MINT_ROLE());

        // Clean up permissions
        acl.grantPermission(root, dao, dao.APP_MANAGER_ROLE());
        acl.revokePermission(this, dao, dao.APP_MANAGER_ROLE());
        acl.setPermissionManager(root, dao, dao.APP_MANAGER_ROLE());

        acl.grantPermission(root, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.revokePermission(this, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.setPermissionManager(root, acl, acl.CREATE_PERMISSIONS_ROLE());
        */
    }
}