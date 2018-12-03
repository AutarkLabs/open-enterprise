pragma solidity ^0.4.24;

import "@tpt/test-helpers/contracts/factory/EVMScriptRegistryFactory.sol";
import "@tpt/test-helpers/contracts/factory/DAOFactory.sol";
import "@tpt/test-helpers/contracts/acl/ACL.sol";
import "@tpt/test-helpers/contracts/lib/minime/MiniMeToken.sol";

// You might think this file is a bit odd, but let me explain.
// We only use the MiniMeToken contract in our tests, which
// means Truffle will not compile it for us, because it is
// from an external dependency.
//
// We are now left with three options:
// - Copy/paste all dependency contracts
// - Run the tests with `truffle compile --all` on
// - Or trick Truffle by claiming we use it in a Solidity test
//
// You know which one I went for.
// -- Somebody from Aragon (probably Jorge?)

// When I first saw this contract I audibly laughed out loud.
// Glad to get to use this janky hack for myself XD


contract Spoof { // solium-disable-line no-empty-blocks
  // ...
}