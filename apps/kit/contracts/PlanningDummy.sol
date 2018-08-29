pragma solidity ^0.4.4;

import "../node_modules/@aragon/os/contracts/apps/AragonApp.sol";

/* This is only a dummy contract to make Aragon happy
when it looks for a standard aragon app structure */
contract PlanningDummy is AragonApp {
    function initialize(string) public onlyInit {
        initialized();
    }
}
