/*
 * SPDX-License-Identitifer:    GPL-3.0-or-later
 */

/* solium-disable function-order */

pragma solidity 0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";

interface ITransferOracle {
    getTransferability(address _from, address _to, uint256 _amount) external;
}

contract WhitelistOracle is AragonApp, ITransferOracle {

    bytes32 public constant ADD_SENDER_ROLE = keccak256("ADD_SENDER_ROLE");
    bytes32 public constant REMOVE_SENDER_ROLE = keccak256("REMOVE_SENDER_ROLE");

    mapping(address => bool) validSender;

    initalize(address[] _senders) external onlyInit {
        initialized();
        for(uint256 i = 0; i < _senders.length; i++){
            validSender[_senders[i]] = true;
        }
    }

    addSender(address _sender) external auth(ADD_SENDER_ROLE){
        validSender[_sender] = true;
    }

    removeSender(address _sender) external auth(REMOVE_SENDER_ROLE) {
        validSender[_sender] = false;
    }

    getTransferability(address _from, address _to, uint256 _amount) external {
        return validSender[_from];
    }

}