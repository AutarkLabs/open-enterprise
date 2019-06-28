pragma solidity ^0.4.24;


contract ExecutionTarget {
    uint256[] public signal;
    uint256[] public level1Id;
    uint256[] public level2Id;
    /// @dev The first 6 arguments in setSignal are necessary in a function that will be forwarded to dotVoting.
    /// Any additional parameters must not be an array type of any form (strings included), or the function will not be forwardable.
    function setSignal(
        address[] /*_addr*/,
        uint256[] _signal,
        uint256[] /*_infoIndices*/,
        string /*_candidateInfo*/,
        string /*description*/,
        uint256[] _level1Id,
        uint256[] _level2Id,
        uint256 /*external vote Identifier*/,
        bool /*test param*/
    ) public
    {
        for (uint i = 0; i < _signal.length; i++) {
            signal.push(_signal[i]);
            level1Id.push(_level1Id[i]);
            level2Id.push(_level2Id[i]);
        }
        emit Executed(_signal.length);
    }

    function autoThrow(uint256[] /*_signal*/) public pure {
        require(false); // solium-disable-line error-reason
    }

    function getSignal(uint256 sigIndex) public view returns (uint256 sig, uint256 l1Id, uint256 l2Id) {
        sig = signal[sigIndex];
        l1Id = level1Id[sigIndex];
        l2Id = level2Id[sigIndex];
    }

    event Executed(uint length);
}