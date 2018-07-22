pragma solidity 0.4.18;

import "@aragon/os/contracts/lib/minime/MiniMeToken.sol";

// import "@aragon/apps-finance/contracts/Finance.sol";
import "@aragon/apps-token-manager/contracts/TokenManager.sol";
import "@aragon/apps-voting/contracts/Voting.sol";

// import "../apps/address-book/contracts/AddressBook.sol";
// import "../apps/github-registry/contracts/GithubRegistry.sol";
// import "../apps/payout-engine/contracts/PayoutEngine.sol";
import "../apps/range-voting/contracts/RangeVoting.sol";

import "./KitBase.sol";

contract Kit is KitBase {
    MiniMeTokenFactory public tokenFactory;
    uint256 constant public PCT = 10 ** 16;
    address constant public ANY_ENTITY = address(-1);

    function Kit(ENS ens) public KitBase(DAOFactory(0), ens) {
        tokenFactory = new MiniMeTokenFactory();
    }   

    function newInstance() public {
        Kernel dao = fac.newDAO(this);
        ACL acl = ACL(dao.acl());
        acl.createPermission(this, dao, dao.APP_MANAGER_ROLE(), this);

        address root = msg.sender;
        
        bytes32 votingAppId = apmNamehash("voting");
        bytes32 tokenManagerId = apmNamehash("token-manager");
        bytes32 rangeVotingId = apmNamehash("range-voting");

        // Planning-App apps
        RangeVoting rangeVoting = RangeVoting(dao.newAppInstance(rangeVotingId, latestVersionAppBase(rangeVotingId)));

        // Aragon apps       
        Voting voting = Voting(dao.newAppInstance(votingAppId, latestVersionAppBase(votingAppId)));		
        TokenManager tokenManager = TokenManager(dao.newAppInstance(tokenManagerId, latestVersionAppBase(tokenManagerId)));  
        
        // Minime token
        MiniMeToken token = tokenFactory.createCloneToken(address(0), 0, "App token", 0, "APP", true);
        token.changeController(tokenManager);
    
        // Initialize apps
        tokenManager.initialize(token, true, 0, true);		
        voting.initialize(token, 50 * PCT, 20 * PCT, 1 days);   
        
        // Manage permissions
        acl.createPermission(ANY_ENTITY, voting, voting.CREATE_VOTES_ROLE(), root);
        acl.grantPermission(voting, tokenManager, tokenManager.MINT_ROLE());
        acl.createPermission(this, tokenManager, tokenManager.MINT_ROLE(), this);
        tokenManager.mint(root, 1); // Give one token to root

        // Range-voting permissions
        acl.createPermission(voting, rangeVoting, rangeVoting.CREATE_VOTES_ROLE(), voting);
        acl.createPermission(ANY_ENTITY, rangeVoting, rangeVoting.ADD_CANDIDATES_ROLE(), root);
        acl.createPermission(voting, rangeVoting, rangeVoting.MODIFY_PARTICIPATION_ROLE(), root);

        // Clean up permissions
        acl.grantPermission(root, dao, dao.APP_MANAGER_ROLE());
        acl.revokePermission(this, dao, dao.APP_MANAGER_ROLE());
        acl.setPermissionManager(root, dao, dao.APP_MANAGER_ROLE());

        acl.grantPermission(root, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.revokePermission(this, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.setPermissionManager(root, acl, acl.CREATE_PERMISSIONS_ROLE());

        DeployInstance(dao);
    }

}
