pragma solidity ^0.4.24;

import "@tps/test-helpers/contracts/apps/AragonApp.sol";
import "@tps/test-helpers/contracts/lib/zeppelin/math/SafeMath.sol";

interface Bounties {
    function issueBounty(
        address _issuer,
        uint _deadline,
        string _data,
        uint256 _fulfillmentAmount,
        address _arbiter,
        bool _paysTokens,
        address _tokenContract
    ) external returns (uint);  

    function activateBounty(
        uint _bountyId, 
        uint _value
    ) external payable;

    function fulfillBounty(
        uint _bountyId, 
        string _data
    ) external;
    
    function acceptFulfillment(
        uint _bountyId, 
        uint _fulfillmentId
    ) external;
}


contract Projects is AragonApp {
    using SafeMath for uint256;
    Bounties bounties;
    function initialize(address _bountiesAddr)//, Vault _vault
    external onlyInit // solium-disable-line visibility-first
    {
        //vault = _vault.ethConnectorBase();
        bounties = Bounties(_bountiesAddr); // Standard Bounties instance
        initialized();
    }

    struct GithubRepo {
        bytes32 owner;  // repo owner's address
        bytes32 repo;  // Github repo id int that is stringified
        mapping(uint256 => GithubIssue) issues;
        uint index;
    }

    struct GithubIssue {
        bytes32 repo;  // This is the internal repo identifier
        uint256 number; // May be redundant tracking this
        bool hasBounty;
        uint standardBountyID; // Not sure if we'll have a way to "retrieve" this value from status open bounties
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
    event BountyAdded(bytes32 owner, bytes32 repo, uint256 issueNumber, uint256 bountySize);
    event FulfillmentAccepted(bytes32 repo, uint256 issueNumber, uint fulfillmentID);

    bytes32 public constant ADD_REPO_ROLE = keccak256("ADD_REPO_ROLE");
    bytes32 public constant REMOVE_REPO_ROLE =  keccak256("REMOVE_REPO_ROLE");
    bytes32 public constant ADD_BOUNTY_ROLE =  keccak256("ADD_BOUNTY_ROLE");
    bytes32 public constant FULFILL_BOUNTY_ROLE = keccak256("FULFILL_BOUNTY_ROLE");


    /**
     * Add an entry to the registry.
     * @param _owner The entry to add to the registry
     * @notice Add selected repository to Managed Projects 
     */
    function addRepo(
        bytes32 _owner, bytes32 _repo
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
    function getRepo(bytes32 _id) public view returns (bytes32 _owner, bytes32 _repo) {
        _owner = repos[_id].owner;
        _repo = repos[_id].repo;
    }

    function addBounties(
        bytes32 _repoID, 
        uint256[] _issueNumbers, 
        uint256[] _bountySizes, 
        uint256[] _deadlines,
        uint256[] _fulfillmentAmounts,
        bool[] _tokenBounties,
        address[] _tokenContracts,
        string _ipfsAddresses
    ) public payable auth(ADD_BOUNTY_ROLE) {
        // ensure the transvalue passed equals transaction value
        checkTransValueEqualsMessageValue(msg.value, _bountySizes,_tokenBounties);
        
        string memory ipfsHash;
        uint standardBountyID;
        // submit the bounty to the StandardBounties contract
        for (uint i = 0; i < _bountySizes.length; i++) {
            ipfsHash = substring(_ipfsAddresses, i.mul(46), i.add(1).mul(46));
            standardBountyID = bounties.issueBounty(
                this,                           //    address _issuer
                _deadlines[i],                  //    uint _deadline
                ipfsHash,                       //     parse input to get ipfs hash
                _fulfillmentAmounts[i],         //    uint256 _fulfillmentAmount
                address(0),                     //    address _arbiter
                _tokenBounties[i],              //    bool _paysTokens
                _tokenContracts[i]             //    address _tokenContract
            );
            // Activate the bounty so it can be fulfilled
            bounties.activateBounty.value(_bountySizes[i])(standardBountyID, _bountySizes[i]);

            //Add bounty to local registry
            _addBounty(
                _repoID, 
                _issueNumbers[i],
                standardBountyID, 
                _bountySizes[i]
            );
        }
    }

    function _addBounty(
        bytes32 _repoID, 
        uint256 _issueNumber,
        uint _standardBountyID,
        uint256 _bountySize
    ) internal 
    {
        repos[_repoID].issues[_issueNumber] = GithubIssue(
            _repoID,
            _issueNumber,
            true,
            _standardBountyID
        );
        emit BountyAdded(
            repos[_repoID].owner,
            repos[_repoID].repo,
            _issueNumber,
            _bountySize
        );
    }

    function fulfillBounty(uint _standardBountyId, string _data) external {
        bounties.fulfillBounty(_standardBountyId, _data);
    }

    function acceptFulfillment(
        bytes32 _repoID,
        uint256 _issueNumber, 
        uint _bountyFulfillmentID
    ) external auth(ADD_BOUNTY_ROLE) {
        GithubIssue storage issue = repos[_repoID].issues[_issueNumber];
        bounties.acceptFulfillment(issue.standardBountyID, _bountyFulfillmentID);
        emit FulfillmentAccepted(_repoID, _issueNumber, _bountyFulfillmentID);
    }

    function getIssue(bytes32 _repoID, uint256 _issueNumber) external view 
    returns(bool hasBounty, uint standardBountyID)
    {
        GithubIssue storage issue = repos[_repoID].issues[_issueNumber];
        hasBounty = issue.hasBounty;
        standardBountyID = issue.standardBountyID;
    }

    function checkTransValueEqualsMessageValue(
        uint256 _msgValue,
        uint256[] _bountySizes,
        bool[] _tokenBounties
    ) internal pure {
        uint256 transValueTotal = 0;
        for (uint i = 0; i < _bountySizes.length; i++) {
            if(!(_tokenBounties[i])) {
                transValueTotal = transValueTotal.add(_bountySizes[i]);
            }
        }
        require(_msgValue >= transValueTotal, "not enough ETH sent to cover bounties");
    }

    function substring(string str, uint startIndex, uint endIndex) internal pure returns (string) {
        // first char is at location 0
        //IPFS addresses span from 0 (startindex) to 46 (endIndex)
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(endIndex-startIndex);
        for(uint i = startIndex; i < endIndex; i++) {
            result[i-startIndex] = strBytes[i];
        }
        return string(result);
    }
}
