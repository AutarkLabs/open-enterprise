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
* @author Autark Labs
* @dev This contract defines an address book (registry) that allows the
* association of a human-readable string to a type, and ethereum address.
*******************************************************************************/
contract AddressBook is AragonApp {

    // The entries in the registry.
    mapping(address => string) entries;
    // Fired when an entry is added to the registry.
    event EntryAdded(address addr);
    // Fired when an entry is removed from the registry.
    event EntryRemoved(address addr);

    bytes32 public constant ADD_ENTRY_ROLE = keccak256("ADD_ENTRY_ROLE");
    bytes32 public constant REMOVE_ENTRY_ROLE = keccak256("REMOVE_ENTRY_ROLE");

    function initialize() external onlyInit {
        initialized();
    }

    /**
     * @notice Add the address `_addr` to the registry.
     * @param _addr The address of the entry to add to the registry
     * @param _cid The IPFS hash of the entry to add to the registry
     */
    function addEntry(
        address _addr,
        string _cid
    ) public auth(ADD_ENTRY_ROLE)
    {
        require(bytes(entries[_addr]).length == 0, "entry exists with that address");
        require(bytes(_cid).length == 46, "CID malformed");

        entries[_addr] = _cid;

        emit EntryAdded(_addr);
    }

    /**
     * @notice Remove address `_addr` from the registry.
     * @param _addr The ID of the entry to remove
     */
    function removeEntry(
        address _addr
    ) public auth(REMOVE_ENTRY_ROLE)
    {
        require(bytes(entries[_addr]).length != 0, "entry does not exist");

        delete entries[_addr];
        emit EntryRemoved(_addr);
    }

    /**
     * Get an entry from the registry.
     * @param _addr The ID of the entry to get
     */
    function getEntry(
        address _addr
    ) public view returns (string contentId)
    {
        contentId = entries[_addr];
    }
}
