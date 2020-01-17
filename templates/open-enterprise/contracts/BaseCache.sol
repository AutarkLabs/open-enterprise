pragma solidity 0.4.24;

import "./BaseTemplate.sol";
import { DotVoting } from "@tps/apps-dot-voting/contracts/DotVoting.sol";


contract BaseCache is BaseTemplate {
    // string constant private ERROR_MISSING_BASE_CACHE = "TEMPLATE_MISSING_BASE_CACHE";

    struct InstalledBase {
        ACL acl;
        Kernel dao;
        Vault vault;
    }

    struct InstalledTokens {
        MiniMeToken token1;
        MiniMeToken token2;
    }

    struct InstalledTokenManagers {
        TokenManager tokenManager1;
        TokenManager tokenManager2;
        WhitelistOracle whitelist;
    }

    struct InstalledVotingApps {
        DotVoting dotVoting;
        Voting voting;
        bool secondaryDot;
        bool secondaryVoting;
    }

    mapping (address => InstalledBase) internal baseCache;
    mapping (address => InstalledTokens) internal tokensCache;
    mapping (address => InstalledTokenManagers) internal tokenManagersCache;
    mapping (address => InstalledVotingApps) internal votingAppsCache;

    constructor(address[5] _deployedSetupContracts)
        BaseTemplate(
            DAOFactory(_deployedSetupContracts[0]),
            ENS(_deployedSetupContracts[1]),
            MiniMeTokenFactory(_deployedSetupContracts[2]),
            IFIFSResolvingRegistrar(_deployedSetupContracts[3])
    ) {}

    function _cacheBase(
        ACL _acl,
        Kernel _dao,
        Vault _vault,
        address _owner
    ) internal
    {
        InstalledBase storage baseInstance = baseCache[_owner];
        baseInstance.acl = _acl;
        baseInstance.dao = _dao;
        baseInstance.vault = _vault;
    }

    function _cacheTokens(
        MiniMeToken _token1,
        MiniMeToken _token2,
        address _owner
    ) internal
    {
        InstalledTokens storage tokensInstance = tokensCache[_owner];
        tokensInstance.token1 = _token1;
        tokensInstance.token2 = _token2;
    }

    function _cacheTokenManagers(
        TokenManager _tokenManager1,
        TokenManager _tokenManager2,
        WhitelistOracle _whitelist,
        address _owner
    ) internal
    {
        InstalledTokenManagers storage tokenManagersInstance = tokenManagersCache[_owner];
        tokenManagersInstance.tokenManager1 = _tokenManager1;
        tokenManagersInstance.tokenManager2 = _tokenManager2;
        tokenManagersInstance.whitelist = _whitelist;
    }

    function _cacheVotingApps(
        DotVoting _dotVoting,
        Voting _voting,
        bool _secondaryDot,
        bool _secondaryVoting,
        address _owner
    ) internal
    {
        InstalledVotingApps storage votingAppsInstance = votingAppsCache[_owner];
        votingAppsInstance.dotVoting = _dotVoting;
        votingAppsInstance.voting = _voting;
        votingAppsInstance.secondaryDot = _secondaryDot;
        votingAppsInstance.secondaryVoting = _secondaryVoting;
    }

    function _popBaseCache(address _owner) internal returns (ACL, Kernel, Vault) {
        // require(baseCache[_owner] != address(0), ERROR_MISSING_BASE_CACHE);

        InstalledBase storage baseInstance = baseCache[_owner];
        ACL acl = baseInstance.acl;
        Kernel dao = baseInstance.dao;
        Vault vault = baseInstance.vault;

        delete baseCache[_owner];
        return (acl, dao, vault);
    }

    function _popTokensCache(address _owner) internal returns (MiniMeToken, MiniMeToken) {
        InstalledTokens storage tokensInstance = tokensCache[_owner];
        MiniMeToken token1 = tokensInstance.token1;
        MiniMeToken token2 = tokensInstance.token2;

        delete tokensCache[_owner];
        return (token1, token2);
    }

    function _popTokenManagersCache(address _owner) internal returns (TokenManager, TokenManager, WhitelistOracle) {
        InstalledTokenManagers storage tokenManagersInstance = tokenManagersCache[_owner];
        TokenManager tokenManager1 = tokenManagersInstance.tokenManager1;
        TokenManager tokenManager2 = tokenManagersInstance.tokenManager2;
        WhitelistOracle whitelist = tokenManagersInstance.whitelist;

        delete tokenManagersCache[_owner];
        return (tokenManager1, tokenManager2, whitelist);
    }

    function _popVotingAppsCache(address _owner) internal returns (DotVoting, Voting, bool, bool) {
        InstalledVotingApps storage votingAppsInstance = votingAppsCache[_owner];
        DotVoting dotVoting = votingAppsInstance.dotVoting;
        Voting voting = votingAppsInstance.voting;
        bool secondaryDot = votingAppsInstance.secondaryDot;
        bool secondaryVoting = votingAppsInstance.secondaryVoting;

        delete votingAppsCache[_owner];
        return (dotVoting, voting, secondaryDot, secondaryVoting);
    }
}
