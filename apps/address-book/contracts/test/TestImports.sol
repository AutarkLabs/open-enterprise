pragma solidity ^0.4.24;

import "@tps/test-helpers/contracts/acl/ACL.sol";
import "@tps/test-helpers/contracts/kernel/Kernel.sol";
import "@tps/test-helpers/contracts/factory/DAOFactory.sol";
import "@tps/test-helpers/contracts/factory/EVMScriptRegistryFactory.sol";

import "@tps/test-helpers/contracts/lib/misc/Migrations.sol";
import "@aragon/apps-shared-minime/contracts/MiniMeToken.sol";
import "@tps/test-helpers/contracts/lib/bounties/StandardBounties.sol";

// You might think this file is a bit odd, but let me explain.
// We only use some contracts in our tests, which means Truffle
// will not compile it for us, because it is from an external
// dependency.
//
// We are now left with three options:
// - Copy/paste these contracts
// - Run the tests with `truffle compile --all` on
// - Or trick Truffle by claiming we use it in a Solidity test
//
// You know which one I went for.


contract TestImports {
    constructor() public { // solium-disable-line no-empty-blocks
    // to avoid lint error
    }
}