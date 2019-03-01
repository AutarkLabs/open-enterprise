pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";

import "@tps/test-helpers/contracts/lib/misc/Migrations.sol";


contract RewardsCore {
    function set(uint _value) public {
        value = _value;
    }

    function get() public constant returns (uint) {
        return value;
    }

    uint value;
}
