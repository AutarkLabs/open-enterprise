/*
 * SPDX-License-Identitifer:    GPL-3.0-or-later
 */

/* solium-disable function-order */

pragma solidity 0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";

interface ITransferOracle {
    function getTransferability(address _from, address _to, uint256 _amount) external returns (bool);
}

contract WhitelistOracle is AragonApp, ITransferOracle {

    /*
    bytes32 public constant ADD_SENDER_ROLE = keccak256("ADD_SENDER_ROLE");
    bytes32 public constant REMOVE_SENDER_ROLE = keccak256("REMOVE_SENDER_ROLE");
    */

    bytes32 public constant ADD_SENDER_ROLE = 0x649896fce4266201ed0200f1f18d2316c4c0be48c949b18cccd5ef15621249e3;
    bytes32 public constant REMOVE_SENDER_ROLE = 0x9d7a040f5c6540f643d8a175f70736671ffabd35f3de2e4176cfcbbe9cd71acb;
    
    string private constant ERROR_SENDER_ALREADY_ADDED = "WO_ERROR_SENDER_ALREADY_ADDED";
    string private constant ERROR_SENDER_NOT_EXIST = "WO_ERROR_SENDER_NOT_EXIST";
    event ValidSenderAdded(address _sender);
    event ValidSenderRemoved(address _sender);
    
    mapping(address => bool) validSender;

    function initialize(address[] _senders) external onlyInit {
        initialized();
        for(uint256 i = 0; i < _senders.length; i++){
            validSender[_senders[i]] = true;
        }
    }

    function addSender(address _sender) external auth(ADD_SENDER_ROLE){
        require(!validSender[_sender], ERROR_SENDER_ALREADY_ADDED);
        validSender[_sender] = true;
        emit ValidSenderAdded(_sender);
    }

    function removeSender(address _sender) external auth(REMOVE_SENDER_ROLE) {
        require(validSender[_sender], ERROR_SENDER_NOT_EXIST);
        validSender[_sender] = false;
        emit ValidSenderRemoved(_sender);
    }

    function getTransferability(address _from, address /*_to*/, uint256 /*_amount*/) external returns (bool) {
        return validSender[_from];
    }

}