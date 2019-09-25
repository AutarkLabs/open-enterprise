pragma solidity 0.4.24;

import "@aragon/templates-shared/contracts/TokenCache.sol";
import "./BaseOETemplate.sol";


contract PlanningKit is BaseOETemplate, TokenCache {
    string constant private ERROR_EMPTY_HOLDERS = "REPUTATION_EMPTY_HOLDERS";
    string constant private ERROR_BAD_HOLDERS_STAKES_LEN = "REPUTATION_BAD_HOLDERS_STAKES_LEN";
    string constant private ERROR_BAD_VOTE_SETTINGS = "REPUTATION_BAD_VOTE_SETTINGS";
    string constant private ERROR_BAD_PAYROLL_SETTINGS = "REPUTATION_BAD_PAYROLL_SETTINGS";

    bool constant private TOKEN_TRANSFERABLE = false;
    uint8 constant private TOKEN_DECIMALS = uint8(18);
    uint256 constant private TOKEN_MAX_PER_ACCOUNT = uint256(0);
    uint64 constant private DEFAULT_FINANCE_PERIOD = uint64(30 days);
    uint256 constant PCT256 = 10 ** 16;
    uint64 constant PCT64 = 10 ** 16;
    StandardBounties registry;

    constructor(DAOFactory _daoFactory, ENS _ens, MiniMeTokenFactory _miniMeFactory, IFIFSResolvingRegistrar _aragonID)
        BaseOETemplate(_daoFactory, _ens, new MiniMeTokenFactory(), _aragonID)
        public
    {
        //_ensureAragonIdIsValid(_aragonID);
        //_ensureMiniMeFactoryIsValid(_miniMeFactory);
        registry = new StandardBounties(msg.sender);

    }

    /**
    * @dev Create a new MiniMe token and deploy a Reputation DAO. This function does not allow Payroll
    *      to be setup due to gas limits.
    * @param _tokenName String with the name for the token used by share holders in the organization
    * @param _tokenSymbol String with the symbol for the token used by share holders in the organization
    * @param _id String with the name for org, will assign `[id].aragonid.eth`
    * @param _holders Array of token holder addresses
    * @param _stakes Array of token stakes for holders (token has 18 decimals, multiply token amount `* 10^18`)
    * @param _votingSettings Array of [supportRequired, minAcceptanceQuorum, voteDuration] to set up the voting app of the organization
    * @param _financePeriod Initial duration for accounting periods, it can be set to zero in order to use the default of 30 days.
    * @param _useAgentAsVault Boolean to tell whether to use an Agent app as a more advanced form of Vault app
    */
    function newTokenAndInstance(
        string _tokenName,
        string _tokenSymbol,
        string _id,
        address[] _holders,
        uint256[] _stakes,
        uint64[3] _votingSettings, /* supportRequired, minAcceptanceQuorum, voteDuration */
        uint64 _financePeriod,
        bool _useAgentAsVault
    )
        external
    {
        newToken(_tokenName, _tokenSymbol);
        newInstance(_id, _holders, _stakes, _votingSettings, _financePeriod, _useAgentAsVault);
    }

    /**
    * @dev Create a new MiniMe token and cache it for the user
    * @param _name String with the name for the token used by share holders in the organization
    * @param _symbol String with the symbol for the token used by share holders in the organization
    */
    function newToken(string memory _name, string memory _symbol) public returns (MiniMeToken) {
        MiniMeToken token = _createToken(_name, _symbol, TOKEN_DECIMALS);
        _cacheToken(token, msg.sender);
        return token; //MiniMeToken(0x0);
    }

    /**
    * @dev Deploy a Reputation DAO using a previously cached MiniMe token
    * @param _id String with the name for org, will assign `[id].aragonid.eth`
    * @param _holders Array of token holder addresses
    * @param _stakes Array of token stakes for holders (token has 18 decimals, multiply token amount `* 10^18`)
    * @param _votingSettings Array of [supportRequired, minAcceptanceQuorum, voteDuration] to set up the voting app of the organization
    * @param _financePeriod Initial duration for accounting periods, it can be set to zero in order to use the default of 30 days.
    * @param _useAgentAsVault Boolean to tell whether to use an Agent app as a more advanced form of Vault app
    */
    function newInstance(
        string memory _id,
        address[] memory _holders,
        uint256[] memory _stakes,
        uint64[3] memory _votingSettings,
        uint64 _financePeriod,
        bool _useAgentAsVault
    )
        public
    {
        _validateId(_id);
        _ensureReputationSettings(_holders, _stakes, _votingSettings);

        (Kernel dao, ACL acl) = _createDAO();
        MiniMeToken token = _popTokenCache(msg.sender);
        (Finance finance, Voting voting) = _setupBaseApps(dao, acl, _holders, _stakes, _votingSettings, _financePeriod, _useAgentAsVault, token);
        _setupOEApps(dao, acl, _useAgentAsVault, token, voting);
        _transferCreatePaymentManagerFromTemplate(acl, finance, voting);
        _transferRootPermissionsFromTemplateAndFinalizeDAO(dao, voting);
        //_registerID(_id, dao);
    }

    /**
    * @dev Deploy a Reputation DAO using a previously cached MiniMe token
    * @param _id String with the name for org, will assign `[id].aragonid.eth`
    * @param _holders Array of token holder addresses
    * @param _stakes Array of token stakes for holders (token has 18 decimals, multiply token amount `* 10^18`)
    * @param _votingSettings Array of [supportRequired, minAcceptanceQuorum, voteDuration] to set up the voting app of the organization
    * @param _financePeriod Initial duration for accounting periods, it can be set to zero in order to use the default of 30 days.
    * @param _useAgentAsVault Boolean to tell whether to use an Agent app as a more advanced form of Vault app
    * @param _payrollSettings Array of [address denominationToken , IFeed priceFeed, uint64 rateExpiryTime, address employeeManager]
             for the payroll app. The `employeeManager` can be set to `0x0` in order to use the voting app as the employee manager.
    */
    function newInstance(
        string memory _id,
        address[] memory _holders,
        uint256[] memory _stakes,
        uint64[3] memory _votingSettings,
        uint64 _financePeriod,
        bool _useAgentAsVault,
        uint256[4] memory _payrollSettings
    )
        public
    {
        _validateId(_id);
        _ensureReputationSettings(_holders, _stakes, _votingSettings, _payrollSettings);

        (Kernel dao, ACL acl) = _createDAO();
        MiniMeToken token = _popTokenCache(msg.sender);
        (Finance finance, Voting voting) = _setupBaseApps(dao, acl, _holders, _stakes, _votingSettings, _financePeriod, _useAgentAsVault, token);
        _setupOEApps(dao, acl, _useAgentAsVault, token, voting);
        _setupPayrollApp(dao, acl, finance, voting, _payrollSettings);
        _transferCreatePaymentManagerFromTemplate(acl, finance, voting);
        _transferRootPermissionsFromTemplateAndFinalizeDAO(dao, voting);
        /*_registerID(_id, dao);*/
    }

    function _setupBaseApps(
        Kernel _dao,
        ACL _acl,
        address[] memory _holders,
        uint256[] memory _stakes,
        uint64[3] memory _votingSettings,
        uint64 _financePeriod,
        bool _useAgentAsVault,
        MiniMeToken _token
    )
        internal
        returns (Finance, Voting)
    {
        Vault agentOrVault = _useAgentAsVault ? _installDefaultAgentApp(_dao) : _installVaultApp(_dao);
        Finance finance = _installFinanceApp(_dao, agentOrVault, _financePeriod == 0 ? DEFAULT_FINANCE_PERIOD : _financePeriod);
        TokenManager tokenManager = _installTokenManagerApp(_dao, _token, TOKEN_TRANSFERABLE, TOKEN_MAX_PER_ACCOUNT);
        Voting voting = _installVotingApp(_dao, _token, _votingSettings);

        _mintTokens(_acl, tokenManager, _holders, _stakes);
        _setupPermissions(_acl, agentOrVault, voting, finance, tokenManager, _useAgentAsVault);
        
        return (finance, voting);
    }

    function _setupOEApps(
        Kernel _dao,
        ACL _acl,
        bool _useAgentAsVault,
        MiniMeToken _token,
        Voting _voting
    )
        internal
    {
        Vault agentOrVault = _useAgentAsVault ? _installDefaultAgentApp(_dao) : _installVaultApp(_dao);
        AddressBook addressBook = _installDefaultAddressApp(_dao);
        Projects projects = _installProjectsApp(_dao, _token, registry, agentOrVault);
        Allocations allocations = _installAllocationsApp(_dao, addressBook, agentOrVault);
        Rewards rewards = _installRewardsApp(_dao, agentOrVault);
        DotVoting dotVoting = _installDotVotingApp(_dao, _token, 50 * PCT256, 0, 1 minutes);
        _setupOEPermissions(_acl, _voting, addressBook, projects, allocations, rewards, dotVoting);
    }

    function _setupPayrollApp(Kernel _dao, ACL _acl, Finance _finance, Voting _voting, uint256[4] memory _payrollSettings) internal {
        (address denominationToken, IFeed priceFeed, uint64 rateExpiryTime, address employeeManager) = _unwrapPayrollSettings(_payrollSettings);
        address manager = employeeManager == address(0) ? _voting : employeeManager;
        Payroll payroll = _installPayrollApp(_dao, _finance, denominationToken, priceFeed, rateExpiryTime);
        _createPayrollPermissions(_acl, payroll, manager, _voting, _voting);
        _grantCreatePaymentPermission(_acl, _finance, payroll);
    }

    function _setupPermissions(
        ACL _acl,
        Vault _agentOrVault,
        Voting _voting,
        Finance _finance,
        TokenManager _tokenManager,
        //AddressBook _addressBook,
        bool _useAgentAsVault
    )
        internal
    {
        if (_useAgentAsVault) {
            _createAgentPermissions(_acl, Agent(_agentOrVault), _voting, _voting);
        }
        _createVaultPermissions(_acl, _agentOrVault, _finance, _voting);
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
        Projects _projects,
        Allocations _allocations,
        Rewards _rewards,
        DotVoting _dotVoting
    )
        internal
    {
        _createAddressPermissions(_acl, _addressBook, _voting, _voting);
        _createProjectsPermissions(_acl, _projects, _voting, _voting);
        _createAllocationsPermissions(_acl, _allocations, _voting, _voting);
        _createRewardsPermissions(_acl, _rewards, _voting, _voting);
        _createDotVotingPermissions(_acl, _dotVoting, _voting, _voting);

    }

    function _ensureReputationSettings(
        address[] memory _holders,
        uint256[] memory _stakes,
        uint64[3] memory _votingSettings,
        uint256[4] memory _payrollSettings
    )
        private
        pure
    {
        _ensureReputationSettings(_holders, _stakes, _votingSettings);
        require(_payrollSettings.length == 4, ERROR_BAD_PAYROLL_SETTINGS);
    }

    function _ensureReputationSettings(address[] memory _holders, uint256[] memory _stakes, uint64[3] memory _votingSettings) private pure {
        require(_holders.length > 0, ERROR_EMPTY_HOLDERS);
        require(_holders.length == _stakes.length, ERROR_BAD_HOLDERS_STAKES_LEN);
        require(_votingSettings.length == 3, ERROR_BAD_VOTE_SETTINGS);
    }
}