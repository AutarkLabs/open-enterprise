pragma solidity 0.4.18;

import "../node_modules/@aragon/os/contracts/apps/AragonApp.sol";

contract PlanningApp is AragonApp {    
    function initialize(string _name) public onlyInit {
        initialized();
    }
}
