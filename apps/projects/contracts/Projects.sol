pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/lib/math/SafeMath.sol";
import "@aragon/apps-vault/contracts/Vault.sol";
import "@aragon/os/contracts/common/IsContract.sol";


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

    function fulfillBounty(
        uint _bountyId,
        string _data
    ) public;

    function acceptFulfillment(
        uint _bountyId,
        uint _fulfillmentId
    ) external;


  function getBounty(uint _bountyId)
      external
      view
      returns (address, uint, uint, bool, uint, uint);

    function getBountyToken(uint _bountyId)
      external
      view
      returns (address);

    function getBountyData(uint _bountyId)
      external
      view
      returns (string);
}

interface TokenApproval {
    function approve(address _spender, uint256 _value) external returns (bool success);
}


contract Projects is IsContract, AragonApp {
    using SafeMath for uint256;
    Bounties public bounties;
    BountySettings public settings;
    Vault public vault;
    //holds all work submissions
    WorkSubmission[] workSubmissions;
    // Auth roles
    bytes32 public constant FUND_ISSUES_ROLE =  keccak256("FUND_ISSUES_ROLE");
    bytes32 public constant ADD_REPO_ROLE = keccak256("ADD_REPO_ROLE");
    bytes32 public constant CHANGE_SETTINGS_ROLE =  keccak256("CHANGE_SETTINGS_ROLE");
    bytes32 public constant CURATE_ISSUES_ROLE = keccak256("CURATE_ISSUES_ROLE");
    bytes32 public constant REMOVE_REPO_ROLE =  keccak256("REMOVE_REPO_ROLE");
    bytes32 public constant REVIEW_APPLICATION_ROLE = keccak256("REVIEW_APPLICATION_ROLE");
    bytes32 public constant WORK_REVIEW_ROLE = keccak256("WORK_REVIEW_ROLE");
    string private constant ERROR_VAULT_NOT_CONTRACT = "PROJECTS_VAULT_NOT_CONTRACT";
    string private constant ERROR_STANDARD_BOUNTIES_NOT_CONTRACT = "STANDARD_BOUNTIES_NOT_CONTRACT";

    // The entries in the repos registry.
    mapping(bytes32 => GithubRepo) private repos;
    // Gives us a repos array so we can actually iterate
    bytes32[] private repoIndex;
    enum SubmissionStatus { Unreviewed, Accepted, Rejected }  // 0: unreviewed 1: Accepted 2: Rejected

    // Structs
    struct BountySettings {
        uint256[] expMultipliers;
        bytes32[] expLevels;
        uint256 baseRate;
        uint256 bountyDeadline;
        address bountyCurrency;
        address bountyAllocator;
        //address bountyArbiter;
    }

    struct GithubRepo {
        mapping(uint256 => GithubIssue) issues;
        uint index;
    }


    struct WorkSubmission {
        SubmissionStatus status;
        string submissionHash; //IPFS hash of the Pull Request
        uint256 fulfillmentId; // Standard Bounties Fulfillment ID
        address submitter;
    }

    struct AssignmentRequest {
        SubmissionStatus status;
        string requestHash; //IPFS hash of the application data
        bool exists;
    }

    struct GithubIssue {
        bytes32 repo;  // This is the internal repo identifier
        uint256 number; // May be redundant tracking this
        bool hasBounty;
        bool fulfilled;
        uint256 bountySize;
        uint256 priority;
        address bountyWallet; // Not sure if we'll have a way to "retrieve" this value from status open bounties
        uint standardBountyId;
        address assignee;
        address[] applicants;
        //uint256 submissionQty;
        uint256[] submissionIndices;
        mapping(address => AssignmentRequest) assignmentRequests;
        //mapping(address => WorkSubmission) workSubmissions;
    }

    // Fired when a repository is added to the registry.
    event RepoAdded(bytes32 indexed repoId, uint index);
    // Fired when a repository is removed from the registry.
    event RepoRemoved(bytes32 indexed repoId, uint index);
    // Fired when a repo is updated in the registry
    event RepoUpdated(bytes32 indexed repoId, uint newIndex);
    // Fired when a bounty is added to a repo
    event BountyAdded(bytes32 repoId, uint256 issueNumber, uint256 bountySize);
    // Fired when an issue is curated
    event IssueCurated(bytes32 repoId);
    // Fired when settings are changed
    event BountySettingsChanged();
    // Fired when user requests issue assignment
    event AssignmentRequested(bytes32 indexed repoId, uint256 issueNumber);
    // Fired when Task Manager approves assignment request
    event AssignmentApproved(address applicant, bytes32 indexed repoId, uint256 issueNumber);
    // Fired when a user submits work towards an issue
    event WorkSubmitted(bytes32 repoId, uint256 issueNumber);
    // Fired when a reviewer accepts accepts a submission
    event SubmissionAccepted(uint256 submissionNumber, bytes32 repoId, uint256 issueNumber);
    // Fired when a reviewer rejects a submission
    event SubmissionRejected(uint256 submissionNumber, bytes32 repoId, uint256 issueNumber);

////////////////
// Constructor
////////////////
    function initialize(address _bountiesAddr, Vault _vault, address _defaultToken)
    external onlyInit // solium-disable-line visibility-first
    {
        initialized();

        require(isContract(_vault), ERROR_VAULT_NOT_CONTRACT);

        vault = _vault;

        bounties = Bounties(_bountiesAddr); // Standard Bounties instance

        _addExperienceLevel(100, bytes32("Beginner"));
        _addExperienceLevel(300, bytes32("Intermediate"));
        _addExperienceLevel(500, bytes32("Advanced"));

        _changeBountySettings(
            1, // baseRate
            336, // bountyDeadline
            _defaultToken, // bountyCurrency
            _bountiesAddr // bountyAllocator
            //0x0000000000000000000000000000000000000000 //bountyArbiter
        );
    }

///////////////////////
// Set state functions
///////////////////////


    /**
     * @notice Update settings for the Projects app
     */
    function changeBountySettings(
        uint256[] _expMultipliers,
        bytes32[] _expLevels,
        uint256 _baseRate,
        uint256 _bountyDeadline,
        address _bountyCurrency,
        address _bountyAllocator
    ) external auth(CHANGE_SETTINGS_ROLE)
    {
        require(_expMultipliers.length == _expLevels.length, "experience level arrays lengths must match");
        settings.expLevels.length = 0;
        settings.expMultipliers.length = 0;
        for (uint i = 0; i < _expLevels.length; i++) {
            _addExperienceLevel(_expMultipliers[i], _expLevels[i]);
        }
        _changeBountySettings(_baseRate, _bountyDeadline, _bountyCurrency, _bountyAllocator);
    }

///////////////////////
// View state functions
///////////////////////

    /**
     * @notice Get issue data from the registry.
     * @param _repoId The id of the Github repo in the projects registry
     */
    function getIssue(bytes32 _repoId, uint256 _issueNumber) external view
    returns(bool hasBounty, uint standardBountyId, bool fulfilled, uint balance, address token, string dataHash, address assignee)
    {
        GithubIssue storage issue = repos[_repoId].issues[_issueNumber];
        hasBounty = issue.hasBounty;
        fulfilled = issue.fulfilled;
        standardBountyId = issue.standardBountyId;
        balance = issue.bountySize;
        dataHash = bounties.getBountyData(standardBountyId);
        token = bounties.getBountyToken(standardBountyId);
        assignee = issue.assignee;
    }

    /**
     * @notice Get registry size.
     */
    function getReposCount() external view returns (uint count) {
        return repoIndex.length;
    }

    /**
     * @notice Get an entry from the registry.
     * @param _repoId The id of the Github repo in the projects registry
     * @return index the Github repo registry index
     */
    function getRepo(bytes32 _repoId) external view returns (uint index) {
        require(isRepoAdded(_repoId), "REPO_NOT_ADDED");
        return(repos[_repoId].index);
    }

    /**
     * @notice Get general settings.
     * @return BountySettings
     */

    function getSettings() external view returns (
        uint256[] expMultipliers,
        bytes32[] expLevels,
        uint256 baseRate,
        uint256 bountyDeadline,
        address bountyCurrency,
        address bountyAllocator
        //address bountyArbiter
    )
    {
        return (
            settings.expMultipliers,
            settings.expLevels,
            settings.baseRate,
            settings.bountyDeadline,
            settings.bountyCurrency,
            settings.bountyAllocator
            //settings.bountyArbiter
        );
    }

///////////////////////
// Repository functions
///////////////////////
    /**
     * @notice Add repository to the Projects app
     * @param _repoId Github id of the repo to add
     * @return index for the added repo at the registry
     */
    function addRepo(
        bytes32 _repoId
    ) external auth(ADD_REPO_ROLE) returns (uint index)
    {
        require(!isRepoAdded(_repoId), "REPO_ALREADY_ADDED");
        repos[_repoId].index = repoIndex.push(_repoId) - 1;
        emit RepoAdded(_repoId, repos[_repoId].index);
        return repoIndex.length - 1;
    }

    /**
     * @notice Remove repository from the Projects app
     * @param _repoId The id of the Github repo in the projects registry
     */
    function removeRepo(
        bytes32 _repoId
    ) external auth(REMOVE_REPO_ROLE) returns (bool success)
    {
        require(isRepoAdded(_repoId), "REPO_NOT_ADDED");
        uint rowToDelete = repos[_repoId].index;

        if (repoIndex.length != 1) {
            bytes32 repoToMove = repoIndex[repoIndex.length - 1];
            repoIndex[rowToDelete] = repoToMove;
            repos[repoToMove].index = rowToDelete;
        }

        repoIndex.length--;
        emit RepoRemoved(_repoId, rowToDelete);
        return true;
    }

///////////////////
// Bounty functions
///////////////////

    /**
     * @notice Request assignment for issue `_issueNumber`
     * @param _repoId the github repo id of the issue
     * @param _issueNumber the github issue up for assignment
     * @param _application IPFS hash for the applicant's proposed timeline and strategy
     */
    function requestAssignment(
        bytes32 _repoId,
        uint256 _issueNumber,
        string _application
    ) external isInitialized
    {
        GithubIssue storage issue = repos[_repoId].issues[_issueNumber];
        require(issue.assignmentRequests[msg.sender].exists == false, "User already applied for this issue");
        issue.applicants.push(msg.sender);
        issue.assignmentRequests[msg.sender] = AssignmentRequest(
            SubmissionStatus.Unreviewed,
            _application,
            true
        );
        emit AssignmentRequested(_repoId, _issueNumber);
    }

    /**
     * @notice Approve assignment for issue `_issueNumber`
     * @param _repoId the github repo id of the issue
     * @param _issueNumber the github issue up for assignment
     * @param _requestor address of user that will be assigned the issue
     * @param _updatedApplication IPFS hash of the application containing optional feedback
     */
    function reviewApplication(
        bytes32 _repoId,
        uint256 _issueNumber,
        address _requestor,
        string _updatedApplication,
        bool _approved
    ) external auth(REVIEW_APPLICATION_ROLE)
    {
        GithubIssue storage issue = repos[_repoId].issues[_issueNumber];
        require(issue.assignmentRequests[_requestor].exists == true, "User has not applied for this issue");
        issue.assignee = _requestor;
        issue.assignmentRequests[_requestor].requestHash = _updatedApplication;

        if (_approved) {
            issue.assignmentRequests[_requestor].status = SubmissionStatus.Accepted;
        } else {
            issue.assignmentRequests[_requestor].status = SubmissionStatus.Rejected;
        }
        emit AssignmentApproved(_requestor, _repoId, _issueNumber);
    }

    /**
     * @notice Submit work for issue `_issueNumber`
     * @dev add a submission to local state after it's been added to StandardBounties.sol
     * @param _repoId the github repo id of the issue
     * @param _issueNumber the github issue up for assignment
     * @param _submissionAddress IPFS hash of the Pull Request
     * //param _fulfillmentId retrieved from event after the work is submitted to the bounties contract externally
     */
    function submitWork(
        bytes32 _repoId,
        uint256 _issueNumber,
        string _submissionAddress
        //uint256 _fulfillmentId
    ) external isInitialized
    {
        GithubIssue storage issue = repos[_repoId].issues[_issueNumber];
        require(!issue.fulfilled,"BOUNTY_FULFILLED");
        require(msg.sender == issue.assignee, "USER_NOT_ASSIGNED");
        bounties.fulfillBounty(issue.standardBountyId, _submissionAddress);
        issue.submissionIndices.push(
            workSubmissions.push(
                WorkSubmission(
                    SubmissionStatus.Unreviewed,
                    _submissionAddress,
                    issue.submissionIndices.length,
                    issue.assignee
                )
            ) - 1 // push returns array length so we need to subtract 1 to get the index value
        );

        emit WorkSubmitted(_repoId, _issueNumber);
    }

    /**
     * @notice Review work for issue `_issueNumber`
     * @dev add a submission to local state after it's been added to StandardBounties.sol
     * @param _repoId the github repo id of the issue
     * @param _issueNumber the github issue up for resolution
     * @param _submissionNumber submission index of the submitted work for review
     * @param _approved decision to accept the contribution
     * @param _updatedSubmissionHash IPFS hash of the submission containing optional feedback
     */
    function reviewSubmission(
        bytes32 _repoId,
        uint256 _issueNumber,
        uint256 _submissionNumber,
        bool _approved,
        string _updatedSubmissionHash
    ) external auth(WORK_REVIEW_ROLE)
    {
        GithubIssue storage issue = repos[_repoId].issues[_issueNumber];

        require(!issue.fulfilled,"BOUNTY_FULFILLED");

        WorkSubmission storage submission = workSubmissions[issue.submissionIndices[_submissionNumber]];
        submission.submissionHash = _updatedSubmissionHash;

        if (_approved) {
            bounties.acceptFulfillment(issue.standardBountyId, submission.fulfillmentId);
            issue.fulfilled = true;
            submission.status = SubmissionStatus.Accepted;
            emit SubmissionAccepted(_submissionNumber, _repoId, _issueNumber);
        } else {
            submission.status = SubmissionStatus.Rejected;
            emit SubmissionRejected(_submissionNumber, _repoId, _issueNumber);
        }
    }

    /**
     * @notice Fund issues: `_description`
     * @param _repoIds The ids of the Github repos in the projects registry
     * @param _issueNumbers an array of bounty indexes
     * @param _bountySizes an array of bounty sizes
     * @param _deadlines an array of bounty deadlines
     * @param _tokenBounties an array of token bounties
     * @param _tokenContracts an array of token contracts
     * @param _ipfsAddresses a string of ipfs addresses
     * @param _description a string describing the bounties
     */
    function addBounties(
        bytes32[] _repoIds,
        uint256[] _issueNumbers,
        uint256[] _bountySizes,
        uint256[] _deadlines,
        bool[] _tokenBounties,
        address[] _tokenContracts,
        string _ipfsAddresses,
        string _description
    ) public payable auth(FUND_ISSUES_ROLE)
    {
        // ensure the transvalue passed equals transaction value
        //checkTransValueEqualsMessageValue(msg.value, _bountySizes,_tokenBounties);
        string memory ipfsHash;
        uint standardBountyId;
        // submit the bounty to the StandardBounties contract
        for (uint i = 0; i < _bountySizes.length; i++) {
            ipfsHash = getHash(_ipfsAddresses, i);

            standardBountyId = bounties.issueBounty(
                this,                           //    address _issuer
                _deadlines[i],                  //    uint256 _deadlines
                ipfsHash,                       //    parse input to get ipfs hash
                _bountySizes[i],                //    uint256 _fulfillmentAmount
                address(0),                     //    address _arbiter
                _tokenBounties[i],              //    bool _paysTokens
                _tokenContracts[i]              //    address _tokenContract
            );

            _activateBounty(
                _tokenBounties[i],
                _tokenContracts[i],
                _bountySizes[i],
                standardBountyId
            );

            //Add bounty to local registry
            _addBounty(
                _repoIds[i],
                _issueNumbers[i],
                standardBountyId,
                _bountySizes[i]
            );
        }
    }

    /**
     * @notice Issue curation: `description`
     * @param description The description of the issue curation
     */
    function curateIssues(
        address[] /*unused_Addresses*/,
        uint256[] issuePriorities,
        uint256[] issueDescriptionIndices,
        string /* unused_issueDescriptions*/,
        string description,
        uint256[] issueRepos,
        uint256[] issueNumbers,
        uint256 /* unused_curationId */
    ) public auth(CURATE_ISSUES_ROLE)
    {
        bytes32 repoId;
        uint256 issueLength = issuePriorities.length;
        //require(issuePriorities.length == unusedAddresses.length, "length mismatch: issuePriorites and unusedAddresses");
        require(issueLength == issueDescriptionIndices.length, "length mismatch: issuePriorites and issueDescriptionIdx");
        require(issueLength == issueRepos.length, "length mismatch: issuePriorites and issueRepos");
        require(issueLength == issueNumbers.length, "length mismatch: issuePriorites and issueNumbers");

        for (uint256 i = 0; i < issueLength; i++) {
            repoId = bytes32(issueRepos[i]);
            repos[repoId].issues[uint256(issueNumbers[i])].priority = issuePriorities[i];
            emit IssueCurated(repoId);
        }
    }

///////////////////////
// Public utility functions
///////////////////////

    /**
     * @notice Checks if a repo exists in the registry
     * @param _repoId the github repo id to check
     * @return _repoId Id for newly added repo
     */
    function isRepoAdded(bytes32 _repoId) public view returns(bool isAdded) {
        if (repoIndex.length == 0)
            return false;
        return (repoIndex[repos[_repoId].index] == _repoId);
    }

    /**
     * @notice Returns Applicant array length
     * @param _repoId the github repo id of the issue
     * @param _issueNumber the github issue up for assignmen
     * @return  array length of the applicants array
     */
    function getApplicantsLength(
        bytes32 _repoId,
        uint256 _issueNumber
    ) public view returns(uint256 applicantQty)
    {
        applicantQty = repos[_repoId].issues[_issueNumber].applicants.length;
    }

    /**
     * @notice Returns Applicant Address
     * @param _repoId the github repo id of the issue
     * @param _issueNumber the github issue up for assignment
     * @param _idx the applicant's position in the array
     * @return  applicant address
     */
    function getApplicant(
        bytes32 _repoId,
        uint256 _issueNumber,
        uint256 _idx
    ) public view returns(address applicant, string application, SubmissionStatus status)
    {
        GithubIssue storage issue = repos[_repoId].issues[_issueNumber];
        applicant = issue.applicants[_idx];
        application = issue.assignmentRequests[applicant].requestHash;
        status = issue.assignmentRequests[applicant].status;
    }

        /**
     * @notice Returns Applicant array length
     * @param _repoId the github repo id of the issue
     * @param _issueNumber the github issue up for assignmen
     * @return  array length of the applicants array
     */
    function getSubmissionsLength(
        bytes32 _repoId,
        uint256 _issueNumber
    ) public view returns(uint256 applicantQty)
    {
        applicantQty = repos[_repoId].issues[_issueNumber].submissionIndices.length;
    }

    /**
     * @notice Returns contributor's work submission
     * @param _repoId the github repo id of the issue
     * @param _issueNumber the github issue being worked on
     * @param _submissionNumber the index of the contribution in the submissions Array
     * @return  application IPFS hash for the applicant's proposed timeline and strategy
     */
    function getSubmission(
        bytes32 _repoId,
        uint256 _issueNumber,
        uint256 _submissionNumber
    ) public view returns(string submissionHash, uint256 fulfillmentId, SubmissionStatus status, address submitter)
    {
        WorkSubmission memory submission = workSubmissions[repos[_repoId].issues[_issueNumber].submissionIndices[_submissionNumber]];
        submissionHash = submission.submissionHash;
        fulfillmentId = submission.fulfillmentId;
        status = submission.status;
        submitter = submission.submitter;
    }

///////////////////////
// Internal functions
///////////////////////

    function _changeBountySettings(
        uint256 _baseRate,
        uint256 _bountyDeadline,
        address _bountyCurrency,
        address _bountyAllocator
    ) internal
    {
        settings.baseRate = _baseRate;
        settings.bountyDeadline = _bountyDeadline;
        settings.bountyCurrency = _bountyCurrency;
        settings.bountyAllocator = _bountyAllocator;

        emit BountySettingsChanged();
    }

    function _addExperienceLevel(
        uint _multiplier,
        bytes32 _description
    ) internal
    {
        settings.expMultipliers.push(_multiplier);
        settings.expLevels.push(_description);
    }

    function _activateBounty(
        bool _tokenBounty,
        address _tokenCountract,
        uint _bountySize,
        uint _standardBountyId
    ) internal
    {
        if (_tokenBounty) {
            vault.transfer(_tokenCountract, this, _bountySize);
            TokenApproval(_tokenCountract).approve(bounties, _bountySize);
            // Activate the bounty so it can be fulfilled
            bounties.activateBounty(_standardBountyId, _bountySize);
        } else {
            bounties.activateBounty.value(_bountySize)(_standardBountyId, _bountySize);
        }
    }

    function _addBounty(
        bytes32 _repoId,
        uint256 _issueNumber,
        uint _standardBountyId,
        uint256 _bountySize
    ) internal
    {
        address[] memory emptyAddressArray = new address[](0);
        uint256[] memory emptySubmissionIndexArray = new uint256[](0);
        repos[_repoId].issues[_issueNumber] = GithubIssue(
            _repoId,
            _issueNumber,
            true,
            false,
            _bountySize,
            999,
            address(0),
            _standardBountyId,
            address(0),
            emptyAddressArray,
            //address(0),
            //0,
            emptySubmissionIndexArray
        );
        emit BountyAdded(
            _repoId,
            _issueNumber,
            _bountySize
        );
    }

    function getHash(
        string _str,
        uint256 _hashIndex
    ) internal pure returns (string)
    {
        // first char is at location 0
        //IPFS addresses span from 0 (startindex) to 46 (endIndex)
        uint256 startIndex = _hashIndex * 46;
        uint256 endIndex = startIndex + 46;
        bytes memory strBytes = bytes(_str);
        bytes memory result = new bytes(endIndex-startIndex);
        uint256 length = endIndex - startIndex;
        uint256 dest;
        uint256 src;
        assembly {
          dest := add(result,0x20)
          src := add(strBytes,add(0x20,startIndex))
          mstore(dest, mload(src))
        }
        src += 32;
        dest += 32;
        length -= 32;
        uint mask = 256 ** (32 - length) - 1;
        assembly {
            let srcpart := and(mload(src), not(mask))
            let destpart := and(mload(dest), mask)
            mstore(dest, or(destpart, srcpart))
        }

        return string(result);
    }

}
