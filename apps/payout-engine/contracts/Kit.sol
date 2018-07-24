pragma solidity 0.4.18;

import "@aragon/os/contracts/factory/DAOFactory.sol";
import "@aragon/os/contracts/apm/Repo.sol";
import "@aragon/os/contracts/lib/ens/ENS.sol";
import "@aragon/os/contracts/lib/ens/PublicResolver.sol";
import "@aragon/os/contracts/apm/APMNamehash.sol";

import "@aragon/apps-voting/contracts/Voting.sol";
import "@aragon/apps-vault/contracts/Vault.sol";
import "@aragon/apps-finance/contracts/Finance.sol";
import "@aragon/apps-vault/contracts/IVaultConnector.sol";
import "@aragon/apps-token-manager/contracts/TokenManager.sol";
import "@aragon/os/contracts/lib/minime/MiniMeToken.sol";

//import "./RangeVoting.sol";

contract KitBase is APMNamehash {
    ENS public ens;
    DAOFactory public fac;

    event DeployInstance(address dao);
    event InstalledApp(address appProxy, bytes32 appId);

    enum Apps { Finance, TokenManager, Vault, Voting }

    function KitBase(DAOFactory _fac, ENS _ens) {
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

	function Kit(ENS ens) KitBase(DAOFactory(0), ens) {
		tokenFactory = new MiniMeTokenFactory();
	}

	function newInstance() {
		Kernel dao = fac.newDAO(this);
		ACL acl = ACL(dao.acl());
		acl.createPermission(this, dao, dao.APP_MANAGER_ROLE(), this);
		address root = msg.sender;
		bytes32 planningAppId = apmNamehash("planning");
		bytes32 rangeVoteAppId = apmNamehash("range-voting");
		bytes32 votingAppId = apmNamehash("voting");
		bytes32 tokenManagerAppId = apmNamehash("token-manager");
		bytes32 vaultAppId = apmNamehash("vault");
		bytes32 financeAppId = apmNamehash("finance");
	

		RangeVoting rangeVoting = RangeVoting(dao.newAppInstance(rangeVoteAppId, latestVersionAppBase(rangeVoteAppId)));
		Voting voting = Voting(dao.newAppInstance(votingAppId, latestVersionAppBase(votingAppId)));
		TokenManager tokenManager = TokenManager(dao.newAppInstance(tokenManagerAppId, latestVersionAppBase(tokenManagerAppId)));
		Vault vault = Vault(dao.newAppInstance(vaultAppId, latestVersionAppBase(vaultAppId)));
		Finance finance = Finance(dao.newAppInstance(financeAppId, latestVersionAppBase(financeAppId)));

        InstalledApp(vault, vaultAppId);
        InstalledApp(voting, votingAppId);
        InstalledApp(tokenManager, tokenManagerAppId);


		MiniMeToken token = tokenFactory.createCloneToken(address(0), 0, "App token", 0, "APP", true);
		token.changeController(tokenManager);


		tokenManager.initialize(token, true, 0, true);
		// Initialize apps
		voting.initialize(token, 50 * PCT, 20 * PCT, 1 days);

        Vault vaultBase = Vault(latestVersionAppBase(vaultAppId));
        // inits
        vault.initialize(vaultBase.erc20ConnectorBase(), vaultBase.ethConnectorBase()); // init with trusted connectors
        finance.initialize(IVaultConnector(vault), uint64(-1) - uint64(now)); // yuge period


		acl.createPermission(ANY_ENTITY, voting, voting.CREATE_VOTES_ROLE(), root);

        acl.createPermission(finance, vault, vault.TRANSFER_ROLE(), voting);
        acl.createPermission(voting, finance, finance.CREATE_PAYMENTS_ROLE(), voting);
        acl.createPermission(voting, finance, finance.EXECUTE_PAYMENTS_ROLE(), voting);
        acl.createPermission(voting, finance, finance.DISABLE_PAYMENTS_ROLE(), voting);
        acl.createPermission(voting, tokenManager, tokenManager.ASSIGN_ROLE(), voting);
        acl.createPermission(voting, tokenManager, tokenManager.REVOKE_VESTINGS_ROLE(), voting);

        acl.createPermission(finance, vault, vault.TRANSFER_ROLE(), voting);
		//acl.createPermission(voting, rangeVoting, rangeVoting.CREATE_VOTES_ROLE(), voting);
		//acl.createPermission(ANY_ENTITY, rangeVoting, rangeVoting.ADD_CANDIDATES_ROLE(), root);
		//acl.createPermission(voting, rangeVoting, rangeVoting.MODIFY_PARTICIPATION_ROLE(), root);
		acl.grantPermission(voting, tokenManager, tokenManager.MINT_ROLE());

		// Clean up permissions
		acl.grantPermission(root, dao, dao.APP_MANAGER_ROLE());
		acl.revokePermission(this, dao, dao.APP_MANAGER_ROLE());
		acl.setPermissionManager(root, dao, dao.APP_MANAGER_ROLE());

		acl.grantPermission(root, acl, acl.CREATE_PERMISSIONS_ROLE());
		acl.revokePermission(this, acl, acl.CREATE_PERMISSIONS_ROLE());
		acl.setPermissionManager(root, acl, acl.CREATE_PERMISSIONS_ROLE());
        /*

        */
		DeployInstance(dao);
	}
}