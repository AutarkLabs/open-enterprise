pragma solidity 0.4.24;

import "./BaseOEApps.sol";


contract OpenEnterpriseTemplate is BaseOEApps {
    string constant private ERROR_MISSING_MEMBERS = "OPEN_ENTERPRISE_MISSING_MEMBERS";
    string constant private ERROR_BAD_VOTE_SETTINGS = "OPEN_ENTERPRISE_BAD_VOTE_SETTINGS";
    string constant private ERROR_BAD_DOT_VOTE_SETTINGS = "OPEN_ENTERPRISE_BAD_DOT_VOTE_SETTINGS";

    // TODO: transferable tokens and remove limits
    bool constant private TOKEN_TRANSFERABLE = false;
    uint8 constant private TOKEN_DECIMALS = uint8(0);
    uint256 constant private TOKEN_MAX_PER_ACCOUNT = uint256(1);
    uint64 constant private DEFAULT_PERIOD = uint64(30 days);

    // TODO: address constant ANY_ENTITY = address(-1);


    // TODO: the old template used to pass planningAppIds here (useful for hatch and different environments??)
    /**
    * @dev Constructor for Open Enterprise Apps DAO
    * @param _deployedSetupContracts Array of [DaoFactory, ENS, MiniMeTokenFactory, AragonID, StandardBounties]
    *       required pre-deployed contracts to set up the organization
    */
    constructor(address[5] _deployedSetupContracts) BaseOEApps(_deployedSetupContracts) public {}

    /**
    * @dev Create a new MiniMe token and deploy a Open Enterprise DAO.
    * @param _tokenName String with the name for the token used by share holders in the organization
    * @param _tokenSymbol String with the symbol for the token used by share holders in the organization
    * @param _id String with the name for org, will assign `[id].aragonid.eth`
    * @param _members Array of member addresses (1 token will be minted for each member)
    * @param _votingSettings Array of [supportRequired, minAcceptanceQuorum, voteDuration] to set up the voting app of the organization
    * @param _financePeriod initial duration for accounting periods, it can be set to zero in order to use the default of 30 days.
    */
    function newTokenAndInstance(
        string _tokenName,
        string _tokenSymbol,
        string _id,
        address[] _members,
        uint64[3] _votingSettings,
        uint64 _financePeriod
    )
        external
    {
        newToken(_tokenName, _tokenSymbol);
        newInstance(
            _id,
            _members,
            _votingSettings,
            _financePeriod
        );
    }

    /**
    * @dev Create a new MiniMe token and cache it for the user
    * @param _name String with the name for the token used by share holders in the organization
    * @param _symbol String with the symbol for the token used by share holders in the organization
    */
    function newToken(string memory _name, string memory _symbol) public returns (MiniMeToken) {
        MiniMeToken token = _createToken(_name, _symbol, TOKEN_DECIMALS);
        _cacheToken(token, msg.sender);
        return token;
    }

    // TODO: Use whitelisted token manager as option, since the rest of template is the same
    /**
    * @dev Deploy a Open Enterprise DAO using a previously cached MiniMe token
    * @param _id String with the name for org, will assign `[id].aragonid.eth`
    * @param _members Array of member addresses (1 token will be minted for each member)
    * @param _votingSettings Array of [supportRequired, minAcceptanceQuorum, voteDuration] to set up the voting app of the organization
    * @param _financePeriod duration for accounting periods, it can be set to zero in order to use the default of 30 days.
    */
    function newInstance(
        string memory _id,
        address[] memory _members,
        uint64[3] memory _votingSettings,
        uint64 _financePeriod
    )
        public
	{
        _validateId(_id);
        // _ensureOpenEnterpriseSettings(_members, _votingSettings, _dotVotingSettings);

        (Kernel dao, ACL acl) = _createDAO();
        (Finance finance, Voting voting, Vault vault) = _setupApps(dao, acl, _members, _votingSettings, _financePeriod);
        // _setupOEApps(dao, acl, vault, voting, _dotVotingSettings, _periodSettings[1], _useDiscussions);
        // _transferCreatePaymentManagerFromTemplate(acl, finance, voting);
        // _transferRootPermissionsFromTemplateAndFinalizeDAO(dao, voting);
        _registerID(_id, dao);
    }

    function _setupApps(
        Kernel _dao,
        ACL _acl,
        address[] memory _members,
        uint64[3] memory _votingSettings,
        uint64 _financePeriod
    )
        internal
        returns (Finance, Voting, Vault)
    {
        MiniMeToken token = _popTokenCache(msg.sender);
        Vault vault = _installVaultApp(_dao);
        Finance finance = _installFinanceApp(_dao, vault, _financePeriod == 0 ? DEFAULT_PERIOD : _financePeriod);
        TokenManager tokenManager = _installTokenManagerApp(_dao, token, TOKEN_TRANSFERABLE, TOKEN_MAX_PER_ACCOUNT);
        Voting voting = _installVotingApp(_dao, token, _votingSettings);
        // TODO: Clean next line (added for testing)
        // AddressBook addressBook = _installAddressBookApp(_dao);

        _cacheToken(token, msg.sender);

        _mintTokens(_acl, tokenManager, _members, 1);
        _setupPermissions(_acl, vault, voting, finance, tokenManager);

        return (finance, voting, vault);
    }

    function _setupOEApps(
        Kernel _dao,
        ACL _acl,
        Vault _vault,
        Voting _voting,
        uint64[3] memory _dotVotingSettings,
        uint64 _allocationsPeriod,
        bool _useDiscussions
    )
        internal
    {
        // if (_useDiscussions) {
        //     DiscussionApp discussions = _installDiscussionsApp(_dao);
        //     // TODO: ANY_ACCOUNT here
        //     _createDiscussionsPermissions(_acl, discussions, _voting, _voting);
        // }

        MiniMeToken token = _popTokenCache(msg.sender);
        AddressBook addressBook = _installAddressBookApp(_dao);
        Allocations allocations = _installAllocationsApp(_dao, _vault, _allocationsPeriod == 0 ? DEFAULT_PERIOD : _allocationsPeriod);
        DotVoting dotVoting = _installDotVotingApp(_dao, token, _dotVotingSettings);
        // Projects projects = _installProjectsApp(_dao, _vault, token);
        // Rewards rewards = _installRewardsApp(_dao, _vault);

        _setupOEPermissions(
            _acl,
            _voting,
            addressBook,
            allocations,
            dotVoting //,
            // projects //,
            // rewards
        );

        _grantVaultPermissions(_acl, _vault, allocations); //, projects); //, rewards);
    }

    function _setupPermissions(
        ACL _acl,
        Vault _vault,
        Voting _voting,
        Finance _finance,
        TokenManager _tokenManager
    )
        internal
    {
        // TODO: reset manager here to be voting instead of this (is needed for OE vault grants)
        _createVaultPermissions(_acl, _vault, _finance, address(this));
        _createFinancePermissions(_acl, _finance, _voting, _voting);
        _createFinanceCreatePaymentsPermission(_acl, _finance, _voting, address(this));
        _createEvmScriptsRegistryPermissions(_acl, _voting, _voting);
        _createVotingPermissions(_acl, _voting, _voting, _tokenManager, _voting);
        _createTokenManagerPermissions(_acl, _tokenManager, _voting, _voting);
    }

    function _setupOEPermissions(
        ACL _acl,
        Voting _voting,
        AddressBook _addressBook,
        Allocations _allocations,
        DotVoting _dotVoting // ,
        // Projects _projects//,
        // Rewards _rewards
    )
        internal
    {
        _createAddressBookPermissions(_acl, _addressBook, _voting, _voting);
        _createAllocationsPermissions(_acl, _allocations, _dotVoting, _voting, _voting);
        _createDotVotingPermissions(_acl, _dotVoting, _voting, _voting);
        // _createProjectsPermissions(_acl, _projects, _dotVoting, _voting, _voting);
        // _createRewardsPermissions(_acl, _rewards, _voting, _voting);
    }

    function _ensureOpenEnterpriseSettings(
        address[] memory _members,
        uint64[3] memory _votingSettings,
        uint64[3] memory _dotVotingSettings
    )
        private
        pure
    {
        require(_members.length > 0, ERROR_MISSING_MEMBERS);
        require(_votingSettings.length == 3, ERROR_BAD_VOTE_SETTINGS);
        require(_dotVotingSettings.length == 3, ERROR_BAD_DOT_VOTE_SETTINGS);
    }
}
