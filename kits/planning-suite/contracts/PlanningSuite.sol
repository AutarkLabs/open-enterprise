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
        bytes32[5] _planningAppIds,
        StandardBounties _registry
    )
        PlanningKitBase(_fac, _ens, _minimeFac, _aragonID, _appIds, _planningAppIds, _registry)
        public
    {
        // solium-disable-previous-line no-empty-blocks
    }

    function newTemplateInstance(string aragonId) public {
        // MiniMeToken token = newToken("Autark Token", "autark");
        // Kernel dao;
        // ACL acl;
        // Finance finance;
        // Voting voting;

        // // TODO: Improve this to avoid storage
        // address[] memory holders;
        // uint256[] memory stakes;

        // holders[0] = address(msg.sender);
        // holders[1] = address(this);

        // stakes[0] = uint256(200 ether);
        // stakes[1] = uint256(100 ether);


        // (dao, acl, finance, , , voting) = createPlanningDAO(
        //     aragonId,
        //     token,
        //     holders,
        //     stakes,
        //     uint256(-1)
        // );

        // TODO:
        // finance.initialize(vault, 1 days);
        // token.approve(finance, 100 ether);
        // voting.initialize(token, 50 * PCT64, 10 * PCT64, 1 days);
        // finance.deposit(token, 50 ether, "Initial token transfer pt 1");
        // finance.deposit(token, 50 ether, "Initial token transfer pt 2");
        
        // TODO: customizable range voting time also

        // TODO: Handle any extra permission or cleanup here
    }

    function newTokenAndInstance(
        string tokenName,
        string tokenSymbol,
        string aragonId,
        address[] holders,
        uint256[] tokens,
        uint64 supportNeeded,
        uint64 minAcceptanceQuorum,
        uint64 voteDuration
    ) public
    {
        newToken(tokenName, tokenSymbol);
        newInstance(
            aragonId,
            holders,
            tokens,
            supportNeeded,
            minAcceptanceQuorum,
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
        uint64 voteDuration
    )
        public
    {
        require(voteDuration > 0, "VOTE_DURATION_IS_ZERO"); // TODO: remove it once we add it to Voting app

        MiniMeToken token = popTokenCache(msg.sender);
        Kernel dao;
        ACL acl;
        Voting voting;
        // RangeVoting rangeVoting;

        (dao, acl, , , , voting) = createPlanningDAO(
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

        // TODO: Here we should initialize custom range Voting params:
        // rangeVoting.initialize(token, 50 * PCT256, 0, 1 minutes);
        // (currently handled upstream by PlanningKitBase)

        // burn support modification permission
        acl.createBurnedPermission(voting, voting.MODIFY_SUPPORT_ROLE());

        cleanupPermission(acl, voting, acl, acl.CREATE_PERMISSIONS_ROLE());
    }
}