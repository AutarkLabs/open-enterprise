pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";


/*******************************************************************************
    Copyright 2018, That Planning Suite

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*******************************************************************************/
/*******************************************************************************
* @title AddressBook Contract
* @author Sean Marquez
* @dev This contract defines an address book (registry) that allows the
* association of a human-readable string to a type, and ethereum address.
*******************************************************************************/
contract AddressBook is AragonApp {
    function initialize() external onlyInit {
        initialized();
    }

    struct Entry {
        address entryAddress;
        string name;
        string entryType;
    }

    // The entries in the registry.
    mapping(address => Entry) entries;
    mapping(bytes32 => bool) nameUsed;

    // Fired when an entry is added to the registry.
    event EntryAdded(address addr);
    // Fired when an entry is removed from the registry.
    event EntryRemoved(address addr);

    bytes32 public constant ADD_ENTRY_ROLE = keccak256("ADD_ENTRY_ROLE");
    bytes32 public constant REMOVE_ENTRY_ROLE = keccak256("REMOVE_ENTRY_ROLE");

    /**
     * @notice Add entity '`_name`' with the address `_addr` to the registry.
     * @param _addr The address of the entry to add to the registry
     * @param _name The name of the entry to add to the registry
     * @param _entryType The type of the entry to add to the registry
     */
    function addEntry(
        address _addr,
        string _name,
        string _entryType
    ) public auth(ADD_ENTRY_ROLE)
    {
        require(entries[_addr].entryAddress == 0, "entry exists with that address");
        require(!nameUsed[keccak256(abi.encodePacked(_name))], "name already in use");

        Entry storage entry = entries[_addr];
        entry.entryAddress = _addr;
        entry.name = _name;
        entry.entryType = _entryType;

        nameUsed[keccak256(abi.encodePacked(entries[_addr].name))] = true;

        emit EntryAdded(_addr);
    }

    /**
     * @notice Remove entity `_addr` from the registry.
     * @param _addr The ID of the entry to remove
     */
    function removeEntry(
        address _addr
    ) public auth(REMOVE_ENTRY_ROLE)
    {
        require(entries[_addr].entryAddress != 0, "entry does not exist");
        // The below assertion will always be shadowed by the above requirement.
        // Because there is no way for it to fail independently of this requirement
        // it is unnecessary
        // assert(nameUsed[keccak256(abi.encodePacked(entries[_addr].name))]); // the name MUST be used
        nameUsed[keccak256(abi.encodePacked(entries[_addr].name))] = false;
        delete entries[_addr];
        emit EntryRemoved(_addr);
    }

    /**
     * Get an entry from the registry.
     * @param _addr The ID of the entry to get
     */
    function getEntry(
        address _addr
    ) public view returns (address _entryAddress, string _name, string _entryType)
    {
        Entry storage entry = entries[_addr];
        require(nameUsed[keccak256(abi.encodePacked(entry.name))], "entry does not exist");

        _entryAddress = entry.entryAddress;
        _name = entry.name;
        _entryType = entry.entryType;
    }
}
