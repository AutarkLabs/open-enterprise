pragma solidity 0.4.24;

import "./BaseOEApps.sol";


contract OpenEnterpriseTemplate is BaseOEApps {
    string constant private ERROR_MISSING_MEMBERS = "OPEN_ENTERPRISE_MISSING_MEMBERS";
    string constant private ERROR_BAD_VOTE_SETTINGS = "OPEN_ENTERPRISE_BAD_VOTE_SETTINGS";
    string constant private ERROR_BAD_DOT_VOTE_SETTINGS = "OPEN_ENTERPRISE_BAD_DOT_VOTE_SETTINGS";
    string constant private ERROR_BAD_MEMBERS_STAKES_LEN = "OPEN_ENTERPRISE_BAD_MEMBER_STAKES_LEN";

    uint64 constant private DEFAULT_PERIOD = uint64(30 days);
    uint8 constant private TOKEN_DECIMALS = uint8(18);
    uint256 constant private TOKEN_MAX_PER_ACCOUNT = uint256(0);
    uint256 constant private MEMBERSHIP_MAX_PER_ACCOUNT = uint256(1e18);

    /**
     * @dev Constructor for Open Enterprise Apps DAO
     * @param _deployedSetupContracts Array of [DaoFactory, ENS, MiniMeTokenFactory, AragonID, StandardBounties]
     *       required pre-deployed contracts to set up the organization
    */
    constructor(address[5] _deployedSetupContracts) BaseOEApps(_deployedSetupContracts) public {}

    /**
     * @dev Create a new MiniMe token and deploy a Open Enterprise DAO.
     * @param _id String with the name for org, will assign `[id].aragonid.eth`
    */
    function newTokensAndInstance(
        string _id,
        string _name1,
        string _symbol1,
        string _name2,
        string _symbol2,
        uint64[6] _votingSettings,
        bool[2] _votingBools
    )
        external
    {
        (MiniMeToken token1, MiniMeToken token2) = newTokens(_name1, _symbol1, _name2, _symbol2);
        _newInstance(_id, _votingSettings, _votingBools, token1, token2);
    }

    /**
     * @dev Install and configure TokenManager apps for previously created tokens
     * @param _tokenBools Array of [transferable?, fixedTokensPerAccount?]
     *       related to the first token. Note: fixedTokens will be non-transferable
     */
    function newTokenManagers(
        address[] _members1,
        uint256[] _stakes1,
        address[] _members2,
        uint256[] _stakes2,
        bool[2] _tokenBools
    ) public
    {
        _validateTokenSettings(_members1, _stakes1);
        _validateTokenSettings(_members2, _stakes2);
        (ACL acl, Kernel dao, Vault vault) = _popBaseCache(msg.sender);
        (MiniMeToken token1, MiniMeToken token2) = _popTokensCache(msg.sender);
        TokenManager tokenManager1 = _installTokenManagerApp(
            dao,
            token1,
            !_tokenBools[1],
            _tokenBools[1] ? MEMBERSHIP_MAX_PER_ACCOUNT : TOKEN_MAX_PER_ACCOUNT
        );
        TokenManager tokenManager2 = TokenManager(0);
        if (address(token2) != address(0) || (_tokenBools[0] && !_tokenBools[1])) {
            WhitelistOracle whitelist = _installWhitelistOracleApp(dao, vault);
            //If token 1 is a reputation token
            // if (_tokenBools[0]) {
            //     _setOracle(acl, tokenManager1, whitelist);
            // }
            //If token 2 is set (token 2 is always a reputation token)
            // if (address(token2) != address(0)) {
            //     WhitelistOracle whitelist = WhitelistOracle(0);
            //     tokenManager2 = _installTokenManagerApp(dao, token2, true, TOKEN_MAX_PER_ACCOUNT);
            //     _mintTokens(acl, tokenManager2, _members2, _stakes2);
            //     _setOracle(acl, tokenManager2, whitelist);
            // }
        }
        _mintTokens(acl, tokenManager1, _members1, _stakes1);
        _cacheBase(acl, dao, vault, msg.sender);
        _cacheTokenManagers(tokenManager1, tokenManager2, whitelist, msg.sender);
    }

    function finalizeDao(
        uint64[2] _periods,
        bool _useDiscussions
    ) public
    {
        (ACL acl, Kernel dao, Vault vault) = _popBaseCache(msg.sender);
        AddressBook addressBook = _installAddressBookApp(dao);
        Allocations allocations = _installAllocationsApp(dao, vault, _periods[0] == 0 ? DEFAULT_PERIOD : _periods[0]);
        Finance finance = _installFinanceApp(dao, vault, _periods[1] == 0 ? DEFAULT_PERIOD : _periods[1]);
        Projects projects = _installProjectsApp(dao, vault);
        Rewards rewards = _installRewardsApp(dao, vault);
        DiscussionApp discussions = DiscussionApp(0);
        if (_useDiscussions) {
            discussions = _installDiscussionsApp(dao);
        }

        _setupTokenPermissions(acl, dao);
        _setupPermissions(
            acl,
            dao,
            addressBook,
            allocations,
            discussions,
            finance,
            projects,
            rewards,
            vault
        );
    }

    /**
     * @dev Create a new MiniMe token and cache it for the user
     * @param _name1 String with the name for the primary token used by share holders in the organization
     * @param _name2 String with the name for the reputation token used in the organization
     * @param _symbol1 String with the symbol for the primary token used by share holders in the organization
     * @param _symbol2 String with the symbol for the reputation token used in the organization
    */
    function newTokens(
        string _name1,
        string _symbol1,
        string _name2,
        string _symbol2
    )
    public returns (MiniMeToken, MiniMeToken)
    {
        MiniMeToken token1 = _createToken(_name1, _symbol1, TOKEN_DECIMALS);
        MiniMeToken token2 = MiniMeToken(0);
        if (keccak256(abi.encodePacked(_symbol2)) != keccak256(abi.encodePacked(""))) {
            token2 = _createToken(_name2, _symbol2, TOKEN_DECIMALS);
        }
        _cacheTokens(token1, token2, msg.sender);

        return (token1, token2);
    }

    /**
     * @dev Deploy a Open Enterprise DAO using a previously cached MiniMe token
     * @param _id String with the name for org, will assign `[id].aragonid.eth`
     * @param _votingBools Array of 2 booleans to select reference for apps:
     *                     [DotVotingToken, VotingToken] true will select token2 as controller
    */
    function _newInstance(
        string _id,
        uint64[6] memory _votingSettings,
        bool[2] memory _votingBools,
        MiniMeToken _token1,
        MiniMeToken _token2
    )
        internal
    {
        _validateId(_id);
        _validateVotingSettings(_votingSettings);

        (Kernel dao, ACL acl) = _createDAO();
        Vault vault = _installVaultApp(dao);
        DotVoting dotVoting = _installDotVotingApp(
            dao,
            _votingBools[0] ? _token2 : _token1,
            _votingSettings[0],
            _votingSettings[1],
            _votingSettings[2]
        );
        Voting voting = _installVotingApp(dao, _votingBools[1] ? _token2 : _token1, _votingSettings[3], _votingSettings[4], _votingSettings[5]);

        _cacheVotingApps(dotVoting, voting, _votingBools[0], _votingBools[1], msg.sender);
        _cacheBase(acl, dao, vault, msg.sender);
        _registerID(_id, dao);
    }

    function _setupPermissions(
        ACL _acl,
        Kernel _dao,
        AddressBook _addressBook,
        Allocations _allocations,
        DiscussionApp _discussions,
        Finance _finance,
        Projects _projects,
        Rewards _rewards,
        Vault _vault
    ) internal
    {
        (DotVoting dotVoting, Voting voting, , ) = _popVotingAppsCache(msg.sender);
        if (address(_discussions) != address(0)) {
            _createDiscussionsPermissions(_acl, _discussions, ANY_ENTITY, voting);
        }
        _createAddressBookPermissions(_acl, _addressBook, voting, voting);
        _createAllocationsPermissions(_acl, _allocations, dotVoting, voting, voting);
        _createEvmScriptsRegistryPermissions(_acl, voting, voting);
        _createFinancePermissions(_acl, _finance, voting, voting);
        _createFinanceCreatePaymentsPermission(_acl, _finance, voting, voting);
        _createProjectsPermissions(_acl, _projects, dotVoting, voting, voting);
        _createRewardsPermissions(_acl, _rewards, voting, voting);
        _createVaultPermissions(_acl, _vault, _finance, address(this));
        _grantVaultPermissions(_acl, _vault, _allocations, _projects, _rewards);

        //Return permissions from the template
        //_transferCreatePaymentManagerFromTemplate(_acl, _finance, voting);
        _transferPermissionFromTemplate(_acl, _vault, _vault.TRANSFER_ROLE(), voting);
        _transferRootPermissionsFromTemplateAndFinalizeDAO(_dao, voting);
    }

    function _setupTokenPermissions(
        ACL _acl,
        Kernel _dao
    ) internal
    {
        (DotVoting dotVoting, Voting voting, bool secondaryDot, bool secondaryVoting) = _popVotingAppsCache(msg.sender);
        (TokenManager tokenManager1, TokenManager tokenManager2, WhitelistOracle whitelist) = _popTokenManagersCache(msg.sender);
        if (address(tokenManager2) != address(0)) {
            _createTokenManagerPermissions(_acl, tokenManager2, voting, voting);
        }
        if (address(whitelist) != address(0)) {
            _createWhitelistPermissions(_acl, whitelist, voting, voting);
        }
        _createDotVotingPermissions(_acl, dotVoting, secondaryDot ? tokenManager2 : tokenManager1, voting);
        _createTokenManagerPermissions(_acl, tokenManager1, voting, voting);
        _createVotingPermissions(_acl, voting, voting, secondaryVoting ? tokenManager2 : tokenManager1, voting);

        _cacheVotingApps(dotVoting, voting, secondaryDot, secondaryVoting, msg.sender);
    }

    function _validateVotingSettings(uint64[6] memory _votingSettings) private pure {
        require(_votingSettings.length == 6, ERROR_BAD_VOTE_SETTINGS);
    }

    /*
    function _validateDotSettings(uint64[3] memory _dotVotingSettings) private pure {
        require(_dotVotingSettings.length == 3, ERROR_BAD_DOT_VOTE_SETTINGS);
    }
    */

    function _validateTokenSettings(address[] memory _members, uint256[] memory _stakes) private pure {
        require(_members.length > 0, ERROR_MISSING_MEMBERS);
        require(_members.length == _stakes.length, ERROR_BAD_MEMBERS_STAKES_LEN);
    }
}