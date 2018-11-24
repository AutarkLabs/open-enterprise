pragma solidity ^0.4.24;


contract ExecutionTarget {
    uint[] public signal;

    function setSignal(
        address[] /*_addr*/, 
        uint256[] /*_infoIndices*/, 
        string /*_candidateInfo*/,
        uint256[] _signal
    ) public {
        for (uint i = 0; i < _signal.length; i++) {
            signal.push(_signal[i]);
        }
        emit Executed(_signal.length);
    }

    function autoThrow(uint256[] /*_signal*/) public pure {
        require(false); // solium-disable-line error-reason
    }

    function getSignal(uint256 sigIndex) public view returns (uint) {
        return signal[sigIndex];
    }

    event Executed(uint length);
}

// contract ExecutionTarget {
//     uint public counter;

//     function execute() {
//         counter += 1;
//         Executed(counter);
//     }

//     function setCounter(uint x) {
//         counter = x;
//     }

//     event Executed(uint x);
// }