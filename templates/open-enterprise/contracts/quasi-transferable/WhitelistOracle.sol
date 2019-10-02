/*
 * SPDX-License-Identifier:    GPL-3.0-or-later
 */

/* solium-disable function-order */

pragma solidity 0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";

interface ITransferOracle {
    function getTransferability(address _from, address _to, uint256 _amount) external returns (bool);
}


contract WhitelistOracle is AragonApp, ITransferOracle {

    bytes32 public constant ADD_SENDER_ROLE = keccak256("ADD_SENDER_ROLE");
    bytes32 public constant REMOVE_SENDER_ROLE = keccak256("REMOVE_SENDER_ROLE");

    mapping(address => bool) validSender;

    function initialize(address[] _senders) external onlyInit {
        initialized();
        for (uint256 i = 0; i < _senders.length; i++) {
            validSender[_senders[i]] = true;
        }
    }

    function addSender(address _sender) external auth(ADD_SENDER_ROLE) {
        validSender[_sender] = true;
    }

    function removeSender(address _sender) external auth(REMOVE_SENDER_ROLE) {
        validSender[_sender] = false;
    }

    function getTransferability(address _from, address /*UNUSED_to*/, uint256 /*UNUSED_amount*/) external returns (bool) {
        return validSender[_from];
    }

}