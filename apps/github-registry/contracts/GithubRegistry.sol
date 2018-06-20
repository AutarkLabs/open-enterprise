pragma solidity 0.4.18;

import "@aragon/os/contracts/apps/AragonApp.sol";

contract GithubRegistry is AragonApp {

    struct GithubRepo {
        bytes32 owner;
        bytes32 repo;
        mapping(uint256 => GithubIssue) issues;
        uint index;
    }

    struct GithubIssue {
        bytes32 repo;  // This is the internal repo identifier
        uint256 number; // May be redundant tracking this
        bool hasBounty;
        uint256 bountySize;
        address bountyWallet; // Not sure if we'll have a way to "retrieve" this value from status open bounties
    }

    // The entries in the registry.
    mapping(bytes32 => GithubRepo) repos;

    // Give us an array so we can actually iterate
    bytes32[] repoIDs;

    // Fired when a repository is added to the registry.
    event RepoAdded(bytes32 id);
    // Fired when a repository is removed from the registry.
    event RepoRemoved(bytes32 id);
    // Fired when a bounty is added to a repo
    event BountyAdded(bytes32 owner, bytes32 repo, uint256 issueNumber, uint256 bountySize);

    bytes32 public constant ADD_ENTRY_ROLE = keccak256("ADD_REPO_ROLE");
    bytes32 public constant REMOVE_ENTRY_ROLE =  keccak256("REMOVE_REPO_ROLE");
    bytes32 public constant ADD_BOUNTY_ROLE =  keccak256("ADD_BOUNTY_ROLE");


    /**
     * Add an entry to the registry.
     * @param _data The entry to add to the registry
     */
    function addRepo(
        bytes32 _owner, bytes32 _repo
    ) public auth(ADD_ENTRY_ROLE) returns (bytes32 _id) {
        _id = keccak256(_owner + _repo);  // overflow should still yield a useable identifier
        repos[_id] = GithubRepo(_owner, _repo);
        //add the index to the repo struct and push the id to the repo array
        repos[_id].index = repoIDs.push(_id) - 1; 
        emit EntryAdded(_id);
    }

    /**
     * Remove an entry from the registry.
     * @param _id The ID of the entry to remove
     */
    function removeRepo(
        bytes32 _id
    ) public auth(REMOVE_ENTRY_ROLE) {
        // Take the repo out of the repo array in constant time by replacing the element
        // with last element
        repoIDs[repos[_id].index] = repoIDs[repoIDs.length - 1];
        repoIDs.length = repoIDs.length - 1;
        delete repos[_id];
        EntryRemoved(_id);
    }

    function getRepoArrayLength() public view returns (uint256) {
        return repoIDs.length;
    }

    /**
     * Get an entry from the registry.
     * @param _id The ID of the entry to get
     */
    function getRepo(
        bytes32 _id
    ) public view returns (bytes32 _owner, bytes32 _repo) {
        _owner = repos[_id].owner;
        _repo = repos[_id].repo;
    }


    function addBounties(bytes32 _repoID, uint256[] _issueNumbers, uint256[] _bountySizes) public  auth(ADD_BOUNTY_ROLE) {
        for (uint i = 0; i < _issueNumbers.length; i++){
            _addBounty(_repoID, _issueNumbers[i], _bountySizes[i]);
        }
    }

    function _addBounty(
        bytes32 _repoID, uint256 _issueNumber, uint256 _bountySize
    ) internal {
        repos[_repoID].issues[_issueNumber] = GithubIssue(_repoID, _issueNumber, true, _bountySize, address(0));
        emit BountyAdded(repos[_repoID].owner, repos[_repoID].repo, _issueNumber, _bountySize);
    }
}
