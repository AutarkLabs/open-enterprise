/*
 * SPDX-License-Identitifer: GPL-3.0-or-later
 */

pragma solidity 0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";


/**
  * @title AddressBook App
  * @author Autark
  * @dev Defines an address book (registry) that allows the
  * association of an ethereum address with an IPFS cID pointing to JSON content
  */
contract AddressBook is AragonApp {

    /// Hardcoded constants to save gas
    /// bytes32 public constant ADD_ENTRY_ROLE = keccak256("ADD_ENTRY_ROLE");
    bytes32 public constant ADD_ENTRY_ROLE = 0x4a167688760e93a8dd0a899c70e125af7d665ed37fd06496b8c83ce9fdac41bd;
    /// bytes32 public constant REMOVE_ENTRY_ROLE = keccak256("REMOVE_ENTRY_ROLE");
    bytes32 public constant REMOVE_ENTRY_ROLE = 0x4bf67e2ff5501162fc2ee020c851b17118c126a125e7f189b1c10056a35a8ed1;
    /// bytes32 public constant UPDATE_ENTRY_ROLE = keccak256("UPDATE_ENTRY_ROLE");
    bytes32 public constant UPDATE_ENTRY_ROLE = 0x6838798f8ade371d93fbc95e535888e5fdc0abba71f87ab7320dd9c8220b4da0;

    /// Error string constants
    string private constant ERROR_NOT_FOUND = "ENTRY_DOES_NOT_EXIST";
    string private constant ERROR_EXISTS = "ENTRY_ALREADY_EXISTS";
    string private constant ERROR_CID_MALFORMED = "CID_MALFORMED";
    string private constant ERROR_NO_CID = "CID_DOES_NOT_MATCH";

    /// The entries in the registry
    mapping(address => string) entries;

    /// Events
    event EntryAdded(address addr); /// Fired when an entry is added to the registry
    event EntryRemoved(address addr); /// Fired when an entry is removed from the registry
    event EntryUpdated(address addr); /// Fired when an entry is updated with a new CID.

    /**
     * @dev Guard to check existence of address in the registry
     * @param _addr The address to enforce its existence in the registry
     */
    modifier entryExists(address _addr) {
        require(bytes(entries[_addr]).length != 0, ERROR_NOT_FOUND);
        _;
    }

    /**
     * @notice Initialize AddressBook app`
     * @dev Initializes the app, this is the Aragon custom constructor
     */
    function initialize() external onlyInit {
        initialized();
    }

    /**
     * @notice Add the entity `_cid` with address `_addr` to the registry.
     * @param _addr The address of the entry to add to the registry
     * @param _cid The IPFS hash of the entry to add to the registry
     */
    function addEntry(address _addr, string _cid) public auth(ADD_ENTRY_ROLE) {
        require(bytes(entries[_addr]).length == 0, ERROR_EXISTS);
        require(bytes(_cid).length == 46, ERROR_CID_MALFORMED);

        entries[_addr] = _cid;
        emit EntryAdded(_addr);
    }

    /**
     * @notice Remove entity `_cid` with address `_addr` from the registry.
     * @param _addr The ID of the entry to remove
     * @param _cid The IPFS hash of the entry to remove from the registry; used only for radpec here
     */
    function removeEntry(address _addr, string _cid) public auth(REMOVE_ENTRY_ROLE) entryExists(_addr) {
        require(keccak256(_cid) == keccak256(entries[_addr]), ERROR_NO_CID);
        delete entries[_addr];
        emit EntryRemoved(_addr);
    }

    /**
     * @notice Update address `_addr` with new entity `_cid` in the registry.
     * @param _addr The ID of the entry to update
     * @param _cid The new CID of updated entity info
     */
    function updateEntry(
        address _addr,
        string _cid
    ) public auth(UPDATE_ENTRY_ROLE) entryExists(_addr)
    {
        require(bytes(_cid).length == 46, "CID malformed");
    
        entries[_addr] = _cid;
        emit EntryUpdated(_addr);
    }

    /**
     * @notice Get data associated to entry `_addr` from the registry.
     * @dev getter for the entries mapping for an addres
     * @param _addr The ID of the entry to get
     * @return contentId pointing to the IPFS structured content object for the entry
     */
    function getEntry(address _addr) public view returns (string contentId) {
        contentId = entries[_addr];
    }
}
