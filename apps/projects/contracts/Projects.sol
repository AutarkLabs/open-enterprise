pragma solidity ^0.4.24;

import "@tps/test-helpers/contracts/apps/AragonApp.sol";
import "@tps/test-helpers/contracts/lib/zeppelin/math/SafeMath.sol";

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
* @title Projects Contract
* @author Kevin Siegler
* @dev This contract defines a registry for Github issues in addition to
* applying bounties in bulk and accepting fulfillment via this contract
*******************************************************************************/
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

    function acceptFulfillment(
        uint _bountyId, 
        uint _fulfillmentId
    ) external;
}


contract Projects is AragonApp {
    using SafeMath for uint256;
    Bounties bounties;

////////////////
// Constructor
////////////////

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
        uint standardBountyId;
    }

    // The entries in the registry.
    mapping(bytes32 => GithubRepo) repos;

    // Gives us an array so we can actually iterate
    bytes32[] repoIds;

    // Fired when a repository is added to the registry.
    event RepoAdded(bytes32 repoId);
    // Fired when a repository is removed from the registry.
    event RepoRemoved(bytes32 repoId);
    // Fired when a bounty is added to a repo
    event BountyAdded(bytes32 owner, bytes32 repoId, uint256 issueNumber, uint256 bountySize);
    // Fired when fulfillment is accepted
    event FulfillmentAccepted(bytes32 repoId, uint256 issueNumber, uint fulfillmentId);

    bytes32 public constant ADD_REPO_ROLE = keccak256("ADD_REPO_ROLE");
    bytes32 public constant REMOVE_REPO_ROLE =  keccak256("REMOVE_REPO_ROLE");
    bytes32 public constant ADD_BOUNTY_ROLE =  keccak256("ADD_BOUNTY_ROLE");
    
///////////////////////
// View state functions
///////////////////////

    /**
     * @notice Get issue data from the registry.
     * @param _repoId The id of the Github repo in the projects registry
     */
    function getIssue(bytes32 _repoId, uint256 _issueNumber) external view
    returns(bool hasBounty, uint standardBountyId)
    {
        GithubIssue storage issue = repos[_repoId].issues[_issueNumber];
        hasBounty = issue.hasBounty;
        standardBountyId = issue.standardBountyId;
    }

    /**
     * @notice Get registry size.
     */
    function getRepoArrayLength() external view returns (uint256) {
        return repoIds.length;
    }

    /**
     * @notice Get an entry from the registry.
     * @param _repoId The id of the Github repo in the projects registry
     * @return _owner repo's owner address
     * @return _repo the Github repo entry
     */
    function getRepo(bytes32 _repoId) external view returns (bytes32 _owner, bytes32 _repo) {
        _owner = repos[_repoId].owner;
        _repo = repos[_repoId].repo;
    }

///////////////////////
// Repository functions
///////////////////////

    /**
     * @notice Add selected repository to Managed Projects 
     * @param _owner The entry to add to the projects registry
     * @param _repo the Github repo entry to add to the projects registry
     * @return _repoId Id for newly added repo
     */
    function addRepo(
        bytes32 _owner,
        bytes32 _repo
    ) external auth(ADD_REPO_ROLE) returns (bytes32 _repoId)
    {
        _repoId = keccak256(abi.encodePacked(_owner, _repo));  // overflow should still yield a useable identifier
        repos[_repoId] = GithubRepo(_owner, _repo, 0);
        //add the index to the repo struct and push the id to the repo array
        repos[_repoId].index = repoIds.push(_repoId) - 1;
        emit RepoAdded(_repoId);
    }

    /**
     * @notice Remove an entry from the projects registry.
     * @param _repoId The id of the Github repo in the projects registry
     */
    function removeRepo(
        bytes32 _repoId
    ) external auth(REMOVE_REPO_ROLE)
    {
        // Take the repo out of the repo array in constant time by replacing the element
        // with last element
        repoIds[repos[_repoId].index] = repoIds[repoIds.length - 1];
        repoIds.length = repoIds.length - 1;
        delete repos[_repoId];
        emit RepoRemoved(_repoId);
    }

///////////////////
// Bounty functions
///////////////////

    /**
     * @notice accept a given fulfillment
     * @param _repoId The id of the Github repo in the projects registry
     * @param _issueNumber the index of the bounty
     * @param _bountyFulfillmentId the index of the fulfillment being accepted
     */
    function acceptFulfillment(
        bytes32 _repoId,
        uint256 _issueNumber, 
        uint _bountyFulfillmentId
    ) external auth(ADD_BOUNTY_ROLE) 
    {
        GithubIssue storage issue = repos[_repoId].issues[_issueNumber];
        bounties.acceptFulfillment(issue.standardBountyId, _bountyFulfillmentId);
        emit FulfillmentAccepted(_repoId, _issueNumber, _bountyFulfillmentId);
    }

    /**
     * @notice add bulk bounties
     * @param _repoId The id of the Github repo in the projects registry
     * @param _issueNumbers an array of bounty indexes
     * @param _bountySizes an array of bounty sizes
     * @param _deadlines an array of bounty deadlines
     * @param _tokenBounties an array of token bounties
     * @param _tokenContracts an array of token contracts
     * @param _ipfsAddresses a string of ipfs addresses
     */
    function addBounties(
        bytes32 _repoId,
        uint256[] _issueNumbers, 
        uint256[] _bountySizes, 
        uint256[] _deadlines,
        bool[] _tokenBounties,
        address[] _tokenContracts,
        string _ipfsAddresses
    ) public payable auth(ADD_BOUNTY_ROLE)
    {
        // ensure the transvalue passed equals transaction value
        checkTransValueEqualsMessageValue(msg.value, _bountySizes,_tokenBounties);
        
        string memory ipfsHash;
        uint standardBountyId;
        // submit the bounty to the StandardBounties contract
        for (uint i = 0; i < _bountySizes.length; i++) {
            ipfsHash = substring(_ipfsAddresses, i.mul(46), i.add(1).mul(46));
            standardBountyId = bounties.issueBounty(
                this,                           //    address _issuer
                _deadlines[i],                  //    uint256 _deadlines
                ipfsHash,                       //    parse input to get ipfs hash
                _bountySizes[i],                //    uint256 _fulfillmentAmount
                address(0),                     //    address _arbiter
                _tokenBounties[i],              //    bool _paysTokens
                address(_tokenContracts[i])     //    address _tokenContract
            );
            // Activate the bounty so it can be fulfilled
            bounties.activateBounty.value(_bountySizes[i])(standardBountyId, _bountySizes[i]);

            //Add bounty to local registry
            _addBounty(
                _repoId,
                _issueNumbers[i],
                standardBountyId,
                _bountySizes[i]
            );
        }
    }

///////////////////////
// Internal functions
///////////////////////

    function _addBounty(
        bytes32 _repoId,
        uint256 _issueNumber,
        uint _standardBountyId,
        uint256 _bountySize
    ) internal 
    {
        repos[_repoId].issues[_issueNumber] = GithubIssue(
            _repoId,
            _issueNumber,
            true,
            _standardBountyId
        );
        emit BountyAdded(
            repos[_repoId].owner,
            repos[_repoId].repo,
            _issueNumber,
            _bountySize
        );
    }

    function checkTransValueEqualsMessageValue(
        uint256 _msgValue,
        uint256[] _bountySizes,
        bool[] _tokenBounties
    ) internal pure 
    {
        uint256 transValueTotal = 0;
        for (uint i = 0; i < _bountySizes.length; i++) {
            if (!(_tokenBounties[i])) {
                transValueTotal = transValueTotal.add(_bountySizes[i]);
            }
        }
        require(_msgValue == transValueTotal, "ETH sent to cover bounties does not match bounty total");
    }

    function substring(
        string str,
        uint startIndex,
        uint endIndex
    ) internal pure returns (string)
    {
        // first char is at location 0
        //IPFS addresses span from 0 (startindex) to 46 (endIndex)
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(endIndex-startIndex);
        for (uint i = startIndex; i < endIndex; i++) {
            result[i-startIndex] = strBytes[i];
        }
        return string(result);
    }
}
