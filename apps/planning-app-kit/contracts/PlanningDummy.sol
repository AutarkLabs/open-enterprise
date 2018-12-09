pragma solidity ^0.4.24;

import "@tps/test-helpers/contracts/apps/AragonApp.sol";


/* This is only a dummy contract to make Aragon happy
when it looks for a standard aragon app structure */
contract PlanningDummy is AragonApp {
    function initialize(string) public onlyInit {
        initialized();
    }
}
