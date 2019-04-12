pragma solidity 0.4.24;

import "./PlanningKitBase.sol";


contract PlanningSuite is PlanningKitBase {
    uint64 constant PCT64 = 10 ** 16;

    constructor(
        DAOFactory _fac,
        ENS _ens,
        MiniMeTokenFactory _minimeFac,
        IFIFSResolvingRegistrar _aragonID,
        bytes32[4] _appIds,
        bytes32[4] _planningAppIds, // TODO: 5 when adding rewards
        StandardBounties _registry
    )
        PlanningKitBase(_fac, _ens, _minimeFac, _aragonID, _appIds, _planningAppIds, _registry)
        public
    {
        // solium-disable-previous-line no-empty-blocks
    }

    function newTokenAndInstance(
        string tokenName,
        string tokenSymbol,
        string aragonId,
        address[] holders,
        uint256[] stakes,
        uint64 supportNeeded,
        uint64 minAcceptanceQuorum,
        uint64 minParticipationPct,
        uint64 candidateSupportPct,
        uint64 voteDuration
    ) public
    {
        newToken(tokenName, tokenSymbol);
        newInstance(
            aragonId,
            holders,
            stakes,
            supportNeeded,
            minAcceptanceQuorum,
            minParticipationPct,
            candidateSupportPct,
            voteDuration
        );
    }

    function newToken(string tokenName, string tokenSymbol) public returns (MiniMeToken token) {
        token = minimeFac.createCloneToken(
            MiniMeToken(address(0)),
            0,
            tokenName,
            18,
            tokenSymbol,
            true
        );
        cacheToken(token, msg.sender);
    }

    function newInstance(
        string aragonId,
        address[] holders,
        uint256[] stakes,
        uint64 supportNeeded,
        uint64 minAcceptanceQuorum,
        uint64 minParticipationPct,
        uint64 candidateSupportPct,
        uint64 voteDuration
    )
        public
    {
        require(voteDuration > 0, "VOTE_DURATION_IS_ZERO"); // TODO: remove it once we add it to Voting app

        MiniMeToken token = popTokenCache(msg.sender);
        Kernel dao;
        ACL acl;
        Voting voting;
        AddressBook addressBook;
        Range rangeVoting;

        (dao, acl, , , , voting, addressBook, rangeVoting) = createPlanningDAO(
            aragonId,
            token,
            holders,
            stakes,
            uint256(-1)
        );

        voting.initialize(
            token,
            supportNeeded,
            minAcceptanceQuorum,
            voteDuration
        );

        addressBook.initialize();

        rangeVoting.initialize(
            addressBook,
            token,
            minParticipationPct,
            candidateSupportPct,
            voteDuration
        );

        // burn support modification permission
        acl.createBurnedPermission(voting, voting.MODIFY_SUPPORT_ROLE());

        cleanupPermission(acl, voting, acl, acl.CREATE_PERMISSIONS_ROLE());
    }
}