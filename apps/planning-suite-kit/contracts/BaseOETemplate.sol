pragma solidity 0.4.24;

import "@tps/apps-address-book/contracts/AddressBook.sol";
//import "@tps/discussions/contracts/DiscussionApp.sol";
import "@tps/apps-allocations/contracts/Allocations.sol";
import "@tps/apps-projects/contracts/Projects.sol";
import "@tps/apps-dot-voting/contracts/DotVoting.sol";
import "@tps/apps-rewards/contracts/Rewards.sol";
import "@tps/test-helpers/contracts/lib/bounties/StandardBounties.sol";

import "@aragon/templates-shared/contracts/BaseTemplate.sol";

contract BaseOETemplate is BaseTemplate {

    /* Hardcoded constant to save gas
    * bytes32 constant internal ADDRESS_BOOK_ID = apmNamehash("address-book");                  // address-book.aragonpm.eth
    * bytes32 constant internal DISCUSSION_ID = apmNamehash("discussion");                  // discussion.aragonpm.eth
    * bytes32 constant internal ALLOCATIONS_ID = apmNamehash("allocations");                // allocations.aragonpm.eth
    * bytes32 constant internal PROJECTS_ID = apmNamehash("projects");                // projects.aragonpm.eth
    * bytes32 constant internal DOT_VOTING_ID = apmNamehash("dot-voting");              // dot-voting.aragonpm.eth
    * bytes32 constant internal REWARARDS_ID = apmNamehash("rewards");              // rewards.aragonpm.eth
    * bytes32 constant internal STANDARD_BOUNTY_ID = apmNamehash("standard-bounties");  // standard-boundies.aragonpm.eth
    */
    bytes32 constant internal ADDRESS_BOOK_ID = 0xe3b84e7e5dbea86505abe0b42cf66a2d38d18d0f23f8b1f1b5ec4974b8c3ab42;
    bytes32 constant internal DISCUSSION_ID = 0x4edce2354c1dbc2978937e4911ffecbea4dc4e7aae02a586d5cc3ba4bb2074c0;
    bytes32 constant internal ALLOCATIONS_ID = 0x2286ac88ea0d1508ed51478e344b9caefab2e516599e3e1f6b440f1ab9780450;
    bytes32 constant internal PROJECTS_ID = 0xa96d28087b0d8ac860d6a2708e96a49a33336f6f1e4a60ebe7b964d792ba22fe;
    bytes32 constant internal DOT_VOTING_ID = 0x6df1d5c16462c5c8d67397b521883343325d4755baf4f60f42788737a9bf087d;
    bytes32 constant internal REWARARDS_ID = 0x34c4f69c5a540b12dc1972f35b6a4d869e650b9e8617cf155838305cfb43cfde;
    bytes32 constant internal STANDARD_BOUNTY_ID = 0xcd7efa1dc3a5303f019e0ef56168c68acc784ef3b4f15ee5fdacfa0532dda0fc;

    constructor (
        DAOFactory _daoFactory,
        ENS _ens,
        MiniMeTokenFactory _miniMeFactory,
        IFIFSResolvingRegistrar _aragonID
        )  BaseTemplate(_daoFactory, _ens, _miniMeFactory, _aragonID) public
    {
    }

    /* ADDRESS BOOK */

    function _installDefaultAddressApp(Kernel _dao) internal returns (AddressBook) {
        bytes memory initializeData = abi.encodeWithSelector(AddressBook(0).initialize.selector);
        AddressBook addressBook = AddressBook(_installDefaultApp(_dao, ADDRESS_BOOK_ID, initializeData));
        return addressBook;
    }

    function _installNonDefaultAddressApp(Kernel _dao) internal returns (AddressBook) {
        bytes memory initializeData = abi.encodeWithSelector(AddressBook(0).initialize.selector);
        return AddressBook(_installNonDefaultApp(_dao, ADDRESS_BOOK_ID, initializeData));
    }

    function _createAddressPermissions(ACL _acl, AddressBook _addressBook, address _grantee, address _manager) internal {
        _acl.createPermission(_grantee, _addressBook, _addressBook.ADD_ENTRY_ROLE(), _manager);
        _acl.createPermission(_grantee, _addressBook, _addressBook.REMOVE_ENTRY_ROLE(), _manager);
    }

    /* DISCUSSION 

    function _installVaultApp(Kernel _dao) internal returns (Vault) {
        bytes memory initializeData = abi.encodeWithSelector(Vault(0).initialize.selector);
        return Vault(_installDefaultApp(_dao, VAULT_APP_ID, initializeData));
    }

    function _createVaultPermissions(ACL _acl, Vault _vault, address _grantee, address _manager) internal {
        _acl.createPermission(_grantee, _vault, _vault.TRANSFER_ROLE(), _manager);
    }
    */

    /* PROJECTS */

    function _installProjectsApp(
        Kernel _dao,
        MiniMeToken _token,
        StandardBounties _registry,
        Vault _vault
    ) internal returns (Projects)
    {
        bytes memory initializeData = abi.encodeWithSelector(Projects(0).initialize.selector, _registry, _vault, _token);
        return Projects(_installNonDefaultApp(_dao, PROJECTS_ID, initializeData));
    }

    function _createProjectsPermissions(ACL _acl, Projects _projects, address _grantee, address _manager) internal {
        _acl.createPermission(_grantee, _projects, _projects.FUND_ISSUES_ROLE(), _manager);
        _acl.createPermission(_grantee, _projects, _projects.ADD_REPO_ROLE(), _manager);
        _acl.createPermission(_grantee, _projects, _projects.CHANGE_SETTINGS_ROLE(), _manager);
        _acl.createPermission(_grantee, _projects, _projects.CURATE_ISSUES_ROLE(), _manager);
        _acl.createPermission(_grantee, _projects, _projects.REMOVE_REPO_ROLE(), _manager);
        _acl.createPermission(_grantee, _projects, _projects.REVIEW_APPLICATION_ROLE(), _manager);
        _acl.createPermission(_grantee, _projects, _projects.WORK_REVIEW_ROLE(), _manager);
    }

    /* DOT VOTING */
    function _installDotVotingApp(
        Kernel _dao,
        MiniMeToken _token,
        uint256 _minQuorum,
        uint256 _candidateSupportPct,
        uint64 _voteTime
    ) internal returns (DotVoting)
    {
        bytes memory initializeData = abi.encodeWithSelector(
            DotVoting(0).initialize.selector,
            _token,
            _minQuorum,
            _candidateSupportPct,
            _voteTime
        );
        return DotVoting(_installNonDefaultApp(_dao, DOT_VOTING_ID, initializeData));
    }

    function _createDotVotingPermissions(ACL _acl, DotVoting _dotVoting, address _grantee, address _manager) internal {
        _acl.createPermission(_grantee, _dotVoting, _dotVoting.CREATE_VOTES_ROLE(), _manager);
        _acl.createPermission(_grantee, _dotVoting, _dotVoting.ADD_CANDIDATES_ROLE(), _manager);
    }

    /* ALLOCATIONS */
    function _installAllocationsApp(
        Kernel _dao,
        AddressBook _addressBook,
        Vault _vault
    ) internal returns (Allocations)
    {
        bytes memory initializeData = abi.encodeWithSelector(Allocations(0).initialize.selector, _addressBook, _vault);
        return Allocations(_installNonDefaultApp(_dao, ALLOCATIONS_ID, initializeData));
    }

    function _createAllocationsPermissions(ACL _acl, Allocations _allocations, address _grantee, address _manager) internal {
        _acl.createPermission(_grantee, _allocations, _allocations.CREATE_ACCOUNT_ROLE(), _manager);
        _acl.createPermission(_grantee, _allocations, _allocations.CREATE_ALLOCATION_ROLE(), _manager);
        _acl.createPermission(_grantee, _allocations, _allocations.EXECUTE_ALLOCATION_ROLE(), _manager);
    }

    /* REWARDS */
    function _installRewardsApp(
        Kernel _dao,
        Vault _vault
    ) internal returns (Rewards)
    {
        bytes memory initializeData = abi.encodeWithSelector(Rewards(0).initialize.selector, _vault);
        return Rewards(_installNonDefaultApp(_dao, REWARARDS_ID, initializeData));
    }

    function _createRewardsPermissions(ACL _acl, Rewards _rewards, address _grantee, address _manager) internal {
        _acl.createPermission(_grantee, _rewards, _rewards.ADD_REWARD_ROLE(), _manager);
    }

}