pragma solidity ^0.4.18;

// TODO: Move ExecutionTarget to a shared location

import "@tpt/test-helpers/contracts/factory/EVMScriptRegistryFactory.sol";
import "@tpt/test-helpers/contracts/factory/DAOFactory.sol";
import "@tpt/test-helpers/contracts/acl/ACL.sol";
import "@tpt/test-helpers/contracts/lib/minime/MiniMeToken.sol";


contract ExecutionTarget {
    uint[] public signal;

    function setSignal(address[] _addr, uint256[] _signal) public {
        for (uint i = 0; i < _signal.length; i++) {
            signal.push(_signal[i]);
        }
        Executed(_signal.length);
    }

    function autoThrow(uint256[] /*_signal*/) public pure {
        require(false);
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