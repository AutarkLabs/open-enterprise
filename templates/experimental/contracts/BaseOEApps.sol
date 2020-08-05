pragma solidity 0.4.24;

import "@aragon/templates-shared/contracts/TokenCache.sol";
import { About } from "@autarklabs/aragon-about/contracts/About.sol";

import "@autarklabs/apps-address-book/contracts/AddressBook.sol";
import "@autarklabs/apps-allocations/contracts/Allocations.sol";
import "@autarklabs/apps-discussions/contracts/DiscussionApp.sol";
import { DotVoting } from "@autarklabs/apps-dot-voting/contracts/DotVoting.sol";
import "@autarklabs/apps-projects/contracts/Projects.sol";
import "@autarklabs/apps-rewards/contracts/Rewards.sol";

import "./BaseCache.sol";


contract BaseOEApps is BaseCache, TokenCache {
    // /* Hardcoded constant to save gas
    //bytes32 constant internal ABOUT_APP_ID = apmNamehash("about.hatch");                           // about.hatch.aragonpm.eth;
    //bytes32 constant internal ADDRESS_BOOK_APP_ID = apmNamehash("address-book-experimental.open"); // address-book-experimental.open.aragonpm.eth
    //bytes32 constant internal ALLOCATIONS_APP_ID = apmNamehash("allocations-experimental.open");   // allocations-experimental.open.aragonpm.eth
    //bytes32 constant internal DISCUSSIONS_APP_ID = apmNamehash("discussions-experimental.open");   // discussions-experimental.open.aragonpm.eth
    //bytes32 constant internal DOT_VOTING_APP_ID = apmNamehash("dot-voting-experimental.open");     // dot-voting-experimental.open.aragonpm.eth
    //bytes32 constant internal PROJECTS_APP_ID = apmNamehash("projects-experimental.open");         // projects-experimental.open.aragonpm.eth
    //bytes32 constant internal REWARDS_APP_ID = apmNamehash("rewards-experimental.open");           // rewards-experimental.open.aragonpm.eth;
    // */
    // TODO: Move to HatchAPM // Main APM ?
    bytes32 constant internal ABOUT_APP_ID = 0xc5dc24db02e4fa7866752fadcd38b600d9a7b04d03e06a5469937aaf56f76d8e;
    bytes32 constant internal ADDRESS_BOOK_APP_ID = 0x298b5513a5cf1ac34532a6987252b67eebd0e5f4f8d58ea8d523209d4e445902;
    bytes32 constant internal ALLOCATIONS_APP_ID = 0xd7f56e56cbe3d08cfabcc728099a172992966500b195767749de465bf3eb9fc6;
    bytes32 constant internal DISCUSSIONS_APP_ID = 0x36ed2b69c7261556794cbbfdfff77470091d1f97a13064941ccb6a2c578ecc3d;
    bytes32 constant internal DOT_VOTING_APP_ID = 0x6936893855b61c8676719f11ebde6fb8089a6d613d50b064786d543bb3799a00;
    bytes32 constant internal PROJECTS_APP_ID = 0x8b2262358894dc727b6cc30678462dc32cf2ea77c6cffad012d21034e923fb7e;
    bytes32 constant internal REWARDS_APP_ID = 0xd211eecce26d0278e7acc6f33fefa9b655e28e81cc899f333abe7d8e30deae80;

    string constant private ERROR_BOUNTIES_NOT_CONTRACT = "BOUNTIES_REGISTRY_NOT_CONTRACT";
    address constant internal ANY_ENTITY = address(-1);
    Bounties internal bountiesRegistry;
    address[] private whiteListed = [address(0), address(0), address(0)];

    /**
    * @dev Constructor for Open Enterprise Apps DAO
    * @param _deployedSetupContracts Array of [DaoFactory, ENS, MiniMeTokenFactory, AragonID, StandardBounties]
    *       required pre-deployed contracts to set up the organization
    */
    constructor(address[5] _deployedSetupContracts)
        BaseCache(_deployedSetupContracts)
        // internal // TODO: This makes the contract abstract
        public
    {
        _ensureAragonIdIsValid(_deployedSetupContracts[3]);
        _ensureMiniMeFactoryIsValid(_deployedSetupContracts[2]);
        require(isContract(address(_deployedSetupContracts[4])), ERROR_BOUNTIES_NOT_CONTRACT);

        bountiesRegistry = Bounties(_deployedSetupContracts[4]);
        whiteListed[1] = address(bountiesRegistry);
    }

/* ABOUT */

    function _installAboutApp(Kernel _dao) internal returns (About) {
        bytes memory initializeData = abi.encodeWithSelector(About(0).initialize.selector);
        return About(_installNonDefaultApp(_dao, ABOUT_APP_ID, initializeData));
    }

    function _createAboutPermissions(ACL _acl, Kernel _dao, address _grantee, address _manager) internal returns (About) {
        About about = _installAboutApp(_dao);
        _acl.createPermission(_grantee, _dao, about.UPDATE_CONTENT(), _manager);
    }

/* ADDRESS-BOOK */

    function _installAddressBookApp(Kernel _dao) internal returns (AddressBook) {
        bytes memory initializeData = abi.encodeWithSelector(AddressBook(0).initialize.selector);
        return AddressBook(_installNonDefaultApp(_dao, ADDRESS_BOOK_APP_ID, initializeData));
    }

    function _createAddressBookPermissions(ACL _acl, AddressBook _addressBook, address _grantee, address _manager) internal {
        _acl.createPermission(_grantee, _addressBook, _addressBook.ADD_ENTRY_ROLE(), _manager);
        _acl.createPermission(_grantee, _addressBook, _addressBook.REMOVE_ENTRY_ROLE(), _manager);
        _acl.createPermission(_grantee, _addressBook, _addressBook.UPDATE_ENTRY_ROLE(), _manager);
    }

/* ALLOCATIONS */

    function _installAllocationsApp(Kernel _dao, Vault _vault, uint64 _periodDuration) internal returns (Allocations) {
        bytes memory initializeData = abi.encodeWithSelector(Allocations(0).initialize.selector, _vault, _periodDuration);
        return Allocations(_installNonDefaultApp(_dao, ALLOCATIONS_APP_ID, initializeData));
    }

    function _createAllocationsPermissions(
        ACL _acl,
        Allocations _allocations,
        address _createAllocationsGrantee,
        address _createAccountsGrantee,
        address _manager
    )
        internal
    {
        _acl.createPermission(_createAccountsGrantee, _allocations, _allocations.CREATE_ACCOUNT_ROLE(), _manager);
        _acl.createPermission(_createAccountsGrantee, _allocations, _allocations.CHANGE_BUDGETS_ROLE(), _manager);
        _acl.createPermission(_createAllocationsGrantee, _allocations, _allocations.CREATE_ALLOCATION_ROLE(), _manager);
        _acl.createPermission(ANY_ENTITY, _allocations, _allocations.EXECUTE_ALLOCATION_ROLE(), _manager);
        _acl.createPermission(ANY_ENTITY, _allocations, _allocations.EXECUTE_PAYOUT_ROLE(), _manager);
    }

/* DOT-VOTING */

    /**
     * @param _dotVotingSettings Array of [minQuorum, candidateSupportPct, voteDuration] to set up the dot voting app of the organization
     **/
    function _installDotVotingApp(Kernel _dao, MiniMeToken _token, uint64[3] memory _dotVotingSettings) internal returns (DotVoting) {
        return _installDotVotingApp(_dao, _token, _dotVotingSettings[0], _dotVotingSettings[1], _dotVotingSettings[2]);
    }

    function _installDotVotingApp(
        Kernel _dao,
        MiniMeToken _token,
        uint64 _quorum,
        uint64 _support,
        uint64 _duration
    )
        internal returns (DotVoting)
    {
        bytes memory initializeData = abi.encodeWithSelector(DotVoting(0).initialize.selector, _token, _quorum, _support, _duration);
        return DotVoting(_installNonDefaultApp(_dao, DOT_VOTING_APP_ID, initializeData));
    }

    function _createDotVotingPermissions(
        ACL _acl,
        DotVoting _dotVoting,
        address _grantee,
        address _manager
    )
        internal
    {
        _acl.createPermission(_grantee, _dotVoting, _dotVoting.ROLE_CREATE_VOTES(), _manager);
    }

/* DISCUSSIONS */

    function _installDiscussionsApp(Kernel _dao) internal returns (DiscussionApp) {
        bytes memory initializeData = abi.encodeWithSelector(DiscussionApp(0).initialize.selector);
        return DiscussionApp(_installNonDefaultApp(_dao, DISCUSSIONS_APP_ID, initializeData));
    }

    function _createDiscussionsPermissions(ACL _acl, DiscussionApp _discussions, address _grantee, address _manager) internal {
        _acl.createPermission(_grantee, _discussions, _discussions.EMPTY_ROLE(), _manager);
    }

/* PROJECTS */

    function _installProjectsApp(Kernel _dao, Vault _vault) internal returns (Projects) {
        bytes memory initializeData = abi.encodeWithSelector(Projects(0).initialize.selector, bountiesRegistry, _vault);
        return Projects(_installNonDefaultApp(_dao, PROJECTS_APP_ID, initializeData));
    }

    function _createProjectsPermissions(
        ACL _acl,
        Projects _projects,
        address _curator,
        address _grantee,
        address _manager
    )
        internal
    {
        _acl.createPermission(_curator, _projects, _projects.CURATE_ISSUES_ROLE(), _manager);
        _acl.createPermission(_grantee, _projects, _projects.FUND_ISSUES_ROLE(), _manager);
        _acl.createPermission(_grantee, _projects, _projects.REMOVE_ISSUES_ROLE(), _manager);
        _acl.createPermission(_grantee, _projects, _projects.FUND_OPEN_ISSUES_ROLE(), _manager);
        _acl.createPermission(_grantee, _projects, _projects.UPDATE_BOUNTIES_ROLE(), _manager);
        _acl.createPermission(_grantee, _projects, _projects.ADD_REPO_ROLE(), _manager);
        _acl.createPermission(_grantee, _projects, _projects.CHANGE_SETTINGS_ROLE(), _manager);
        _acl.createPermission(_grantee, _projects, _projects.REMOVE_REPO_ROLE(), _manager);
        _acl.createPermission(_grantee, _projects, _projects.REVIEW_APPLICATION_ROLE(), _manager);
        _acl.createPermission(_grantee, _projects, _projects.WORK_REVIEW_ROLE(), _manager);
    }

/* REWARDS */

    function _installRewardsApp(Kernel _dao, Vault _vault) internal returns (Rewards) {
        bytes memory initializeData = abi.encodeWithSelector(Rewards(0).initialize.selector, _vault);
        return Rewards(_installNonDefaultApp(_dao, REWARDS_APP_ID, initializeData));
    }

    function _createRewardsPermissions(
        ACL _acl,
        Rewards _rewards,
        address _grantee,
        address _manager
    )
        internal
    {
        _acl.createPermission(_grantee, _rewards, _rewards.ADD_REWARD_ROLE(), _manager);
    }

/* WHITELIST-ORACLE */

    function _initializeWhitelistOracleApp(WhitelistOracle _whitelist, address _vault, address _finance) internal {
        whiteListed[0] = _vault;
        whiteListed[2] = _finance;
        _whitelist.initialize(whiteListed);
    }

/* OPEN ENTERPRISE SPECIFIC VAULT PERMISSIONS */

    function _grantVaultPermissions(ACL _acl, Vault _vault, Allocations _allocations, Projects _projects, Rewards _rewards) internal {
        _acl.grantPermission(_allocations, _vault, _vault.TRANSFER_ROLE());
        _acl.grantPermission(_projects, _vault, _vault.TRANSFER_ROLE());
        _acl.grantPermission(_rewards, _vault, _vault.TRANSFER_ROLE());
    }

    /**
     * @dev Overloaded from BaseTemplate to remove granted permissions, not needed for Open Enterprise
     */
    function _transferPermissionFromTemplate(ACL _acl, address _app, bytes32 _permission, address _manager) internal {
        _acl.revokePermission(address(this), _app, _permission);
        _acl.setPermissionManager(_manager, _app, _permission);
    }
}
