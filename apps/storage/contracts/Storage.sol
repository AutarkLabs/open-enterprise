pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";


contract Storage is AragonApp {

    /// Events
    event Registered(bytes32 indexed key);
    event PinHash(string cid);

    /// State: data registry
    mapping(bytes32 => string) internal registeredData;

    /// ACL
    bytes32 constant public REGISTER_DATA_ROLE = keccak256("REGISTER_DATA_ROLE");

    /// Custom aragon constructor
    function initialize() public onlyInit {
        initialized();
    }

    /**
     * @notice Set `_key` data to `_cid`
     * @param _key Data item that will be stored in the registry
     * @param _cid Data content to be stored
     */

    function registerData(bytes32 _key, string _cid) external auth(REGISTER_DATA_ROLE) {
        registeredData[_key] = _cid;
        emit Registered(_key);
        emit PinHash(_cid);
    }

    function getRegisteredData(bytes32 _key) external view returns(string) {
        return registeredData[_key];
    }
}
