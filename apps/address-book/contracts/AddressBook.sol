pragma solidity ^0.4.18;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/lib/zeppelin/math/SafeMath.sol";

/*******************************************************************************
  Copyright 2018, That Planning Tab

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
    struct Entry {
        address entryAddress;
        string name;
        string entryType;
    }

    // The entries in the registry.
    Entry[] entries;

    // Fired when an entry is added to the registry.
    event EntryAdded(bytes32 id);
    // Fired when an entry is removed from the registry.
    event EntryRemoved(bytes32 id);

    bytes32 public constant ADD_ENTRY_ROLE = bytes32(1);
    bytes32 public constant REMOVE_ENTRY_ROLE = bytes32(2);

    /**
     * Add an entry to the registry.
     * @param _data The entry to add to the registry
     */
    function add(
        address _address,
        string _name,
        string _entryType
    ) public auth(ADD_ENTRY_ROLE) returns (bytes32 _id) {
        _id = keccak256(_name);

        Entry storage entry = entries[_id];
        entry.entryAddress = _address;
        entry.name = _name;
        entry.entryType = _entryType;

        EntryAdded(_id);
    }

    /**
     * Remove an entry from the registry.
     * @param _id The ID of the entry to remove
     */
    function remove(
        bytes32 _id
    ) public auth(REMOVE_ENTRY_ROLE) {
        delete entries[_id];
        EntryRemoved(_id);
    }

    /**
     * Get an entry from the registry.
     * @param _id The ID of the entry to get
     */
    function get(
        bytes32 _id
    ) public constant returns (address, string, string) {
        Entry storage entry = entries[_id];

        return(
            entry.entryAddress,
            entry.name,
            entry.entryType
        );
    }
}
