pragma solidity ^0.4.24;


contract RewardsCore {
    function set(uint _value) public {
        value = _value;
    }

    function get() public constant returns (uint) {
        return value;
    }

    uint value;
}
