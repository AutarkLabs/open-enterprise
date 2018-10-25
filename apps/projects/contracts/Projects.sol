pragma solidity ^0.4.24;

import "@tpt/test-helpers/contracts/apps/AragonApp.sol";


contract Projects is AragonApp {
    function initialize( // solium-disable-line blank-lines
        //Vault _vault
    ) external onlyInit // solium-disable-line visibility-first
    {
        //vault = _vault.ethConnectorBase();
        initialized();
    }

    struct GithubRepo {
        bytes20 owner;  // repo owner's address
        bytes12 repo;  // Github repo id int that is stringified
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

    // Gives us an array so we can actually iterate
    bytes32[] repoIDs;

    // Fired when a repository is added to the registry.
    event RepoAdded(bytes32 id);
    // Fired when a repository is removed from the registry.
    event RepoRemoved(bytes32 id);
    // Fired when a bounty is added to a repo
    event BountyAdded(bytes20 owner, bytes12 repo, uint256 issueNumber, uint256 bountySize);

    bytes32 public constant ADD_REPO_ROLE = keccak256("ADD_REPO_ROLE");
    bytes32 public constant REMOVE_REPO_ROLE =  keccak256("REMOVE_REPO_ROLE");
    bytes32 public constant ADD_BOUNTY_ROLE =  keccak256("ADD_BOUNTY_ROLE");


    /**
     * Add an entry to the registry.
     * @param _id The entry to add to the registry
     */
    function addRepo(
        bytes20 _owner, bytes12 _repo
    ) public auth(ADD_REPO_ROLE) returns (bytes32 _id) 
    {
        _id = keccak256(abi.encodePacked(_owner, _repo));  // overflow should still yield a useable identifier
        repos[_id] = GithubRepo(_owner, _repo, 0);
        //add the index to the repo struct and push the id to the repo array
        repos[_id].index = repoIDs.push(_id) - 1; 
        emit RepoAdded(_id);
    }

    /**
     * Remove an entry from the registry.
     * @param _id The ID of the entry to remove
     */
    function removeRepo(
        bytes32 _id
    ) public auth(REMOVE_REPO_ROLE)
    {
        // Take the repo out of the repo array in constant time by replacing the element
        // with last element
        repoIDs[repos[_id].index] = repoIDs[repoIDs.length - 1];
        repoIDs.length = repoIDs.length - 1;
        delete repos[_id];
        emit RepoRemoved(_id);
    }

    function getRepoArrayLength() public view returns (uint256) {
        return repoIDs.length;
    }

    /**
     * Get an entry from the registry.
     * @param _id The ID of the entry to get
     */
    function getRepo(bytes32 _id) public view returns (bytes20 _owner, bytes12 _repo) {
        _owner = repos[_id].owner;
        _repo = repos[_id].repo;
    }

    function addBounties(bytes32 _repoID, uint256[] _issueNumbers, uint256[] _bountySizes) public  auth(ADD_BOUNTY_ROLE) {
        for (uint i = 0; i < _issueNumbers.length; i++) {
            _addBounty(_repoID, _issueNumbers[i], _bountySizes[i]);
        }
    }

    function _addBounty(
        bytes32 _repoID, uint256 _issueNumber, uint256 _bountySize
    ) internal 
    {
        repos[_repoID].issues[_issueNumber] = GithubIssue(
            _repoID,
            _issueNumber,
            true,
            _bountySize,
            address(0)
        );
        emit BountyAdded(
            repos[_repoID].owner,
            repos[_repoID].repo,
            _issueNumber,
            _bountySize
        );
    }
}
