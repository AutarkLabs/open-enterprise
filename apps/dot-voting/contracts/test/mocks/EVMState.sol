pragma solidity ^0.4.24;


contract EVMState {
    uint256 counter;

    constructor() public {
        counter = 0;
    }

    function update() external {
        counter++;
    }
}
