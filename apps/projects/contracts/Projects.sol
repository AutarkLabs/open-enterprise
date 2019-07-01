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
* @author Autark Labs
* @dev This contract defines a registry for project tasks in addition to
* applying bounties in bulk and accepting fulfillment via this contract
*******************************************************************************/
interface Bounties {

    // issueBounty will be deleted once testing is reimplemented
    function issueBounty(
        address sender,
        address[] _issuers,
        address[] _approvers,
        string _data,
        uint _deadline,
        address _token,
        uint _tokenVersion
    ) external returns (uint);

    function contribute(
        address _sender,
        uint _bountyId,
        uint _amount
    ) external payable;

    function issueAndContribute(
        address sender,
        address[] _issuers,
        address[] _approvers,
        string _data,
        uint _deadline,
        address _token,
        uint _tokenVersion,
        uint _depositAmount
    ) external payable returns (uint);

    function performAction(
        address _sender,
        uint _bountyId,
        string _data
    ) external;

    function acceptFulfillment(
        address _sender,
        uint _bountyId,
        uint _fulfillmentId,
        uint _approverId,
        uint[] _tokenAmounts
    ) external;

    function drainBounty(
        address _sender,
        uint _bountyId,
        uint _issuerId,
        uint[] _amounts
    ) external;

    function changeDeadline(
        address _sender,
        uint _bountyId,
        uint _issuerId,
        uint _deadline
    ) external;
}

interface Relayer {
    function metaFulfillBounty(
        bytes _signature,
        uint _bountyId,
        address[] _fulfillers,
        string _data,
        uint256 _nonce
    ) external;
}

interface ERC20Token {
    function approve(address _spender, uint256 _value) external returns (bool success);
    function transfer(address to, uint tokens) external returns (bool success);
}


contract Projects is IsContract, AragonApp, DepositableStorage {
    using SafeMath for uint256;
    Bounties public bounties;
    Relayer public relayer;
    BountySettings public settings;
    Vault public vault;
    //holds all work submissions
    WorkSubmission[] workSubmissions;
    // Auth roles
    bytes32 public constant FUND_ISSUES_ROLE =  keccak256("FUND_ISSUES_ROLE");
    bytes32 public constant REMOVE_ISSUES_ROLE = keccak256("REMOVE_ISSUES_ROLE");
    bytes32 public constant ADD_REPO_ROLE = keccak256("ADD_REPO_ROLE");
    bytes32 public constant CHANGE_SETTINGS_ROLE =  keccak256("CHANGE_SETTINGS_ROLE");
    bytes32 public constant CURATE_ISSUES_ROLE = keccak256("CURATE_ISSUES_ROLE");
    bytes32 public constant REMOVE_REPO_ROLE =  keccak256("REMOVE_REPO_ROLE");
    bytes32 public constant REVIEW_APPLICATION_ROLE = keccak256("REVIEW_APPLICATION_ROLE");
    bytes32 public constant WORK_REVIEW_ROLE = keccak256("WORK_REVIEW_ROLE");
    bytes32 public constant FUND_OPEN_ISSUES_ROLE = keccak256("FUND_OPEN_ISSUES_ROLE");
    string private constant ERROR_VAULT_NOT_CONTRACT = "PROJECTS_VAULT_NOT_CONTRACT";
    string private constant ERROR_STANDARD_BOUNTIES_NOT_CONTRACT = "STANDARD_BOUNTIES_NOT_CONTRACT";
    string private constant ERROR_LENGTH_EXCEEDED = "LENGTH_EXCEEDED";
    string private constant ERROR_LENGTH_MISMATCH = "LENGTH_MISMATCH";
    string private constant ERROR_BOUNTY_FULFILLED = "BOUNTY_FULFILLED";
    string private constant ERROR_BOUNTY_REMOVED = "BOUNTY_REMOVED";

    // The entries in the repos registry.
    mapping(bytes32 => Repo) private repos;
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
        //address metaTxRelayer; TODO: Implement this interface
        //address bountyArbiter;
    }

    struct Repo {
        mapping(uint256 => Issue) issues;
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

    struct Issue {
        bytes32 repo;  // This is the internal repo identifier
        uint256 number; // May be redundant tracking this
        bool hasBounty;
        bool fulfilled;
        address tokenContract;
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
    event BountyAdded(bytes32 repoId, uint256 issueNumber, uint256 bountySize, uint256 registryId);
    // Fired when a bounty is removed
    event BountyRemoved(bytes32 repoId, uint256 issueNumber, uint256 oldBountySize);
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
    // Fired when a bounty is opened up to work submissions from anyone
    event AwaitingSubmissions(bytes32 repoId, uint256 issueNumber);
    event BountyTest(uint256 id);

////////////////
// Constructor
////////////////
    function initialize(
        address _bountiesAddr,
        //address _relayer, TODO: Implement this
        Vault _vault
    ) external onlyInit // solium-disable-line visibility-first
    {
        initialized();
        setDepositable(true);

        require(isContract(_vault), ERROR_VAULT_NOT_CONTRACT);

        vault = _vault;

        bounties = Bounties(_bountiesAddr); // Standard Bounties instance

        _addExperienceLevel(100, bytes32("Beginner"));
        _addExperienceLevel(300, bytes32("Intermediate"));
        _addExperienceLevel(500, bytes32("Advanced"));

        _changeBountySettings(
            100, // baseRate
            336, // bountyDeadline
            address(0), // default bounty currency inits to zero
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
     * @param _repoId The id of the repo in the projects registry
     */
    function getIssue(bytes32 _repoId, uint256 _issueNumber) external view
    returns(bool hasBounty, uint standardBountyId, bool fulfilled, uint balance, address assignee)
    {
        Issue storage issue = repos[_repoId].issues[_issueNumber];
        hasBounty = issue.hasBounty;
        fulfilled = issue.fulfilled;
        standardBountyId = issue.standardBountyId;
        balance = issue.bountySize;
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
     * @param _repoId The id of the repo in the projects registry
     * @return index the repo registry index
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
     * @param _repoId id of the repo to be aadded
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
     * @param _repoId The id of the repo in the projects registry
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
     * @param _repoId the repo id of the issue
     * @param _issueNumber the issue up for assignment
     * @param _application IPFS hash for the applicant's proposed timeline and strategy
     */
    function requestAssignment(
        bytes32 _repoId,
        uint256 _issueNumber,
        string _application
    ) external isInitialized
    {
        Issue storage issue = repos[_repoId].issues[_issueNumber];
        require(issue.assignmentRequests[msg.sender].exists == false, "User already applied for this issue");
        issue.applicants.push(msg.sender);
        issue.assignmentRequests[msg.sender] = AssignmentRequest(
            SubmissionStatus.Unreviewed,
            _application,
            true
        );
        bounties.performAction(
            address(this),
            issue.standardBountyId,
            _application
        );
        emit AssignmentRequested(_repoId, _issueNumber);
    }

    /**
     * @notice Approve assignment for issue `_issueNumber`
     * @param _repoId the repo id of the issue
     * @param _issueNumber the issue up for assignment
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
        Issue storage issue = repos[_repoId].issues[_issueNumber];
        require(issue.assignmentRequests[_requestor].exists == true, "User has not applied for this issue");
        issue.assignee = _requestor;
        issue.assignmentRequests[_requestor].requestHash = _updatedApplication;

        if (_approved) {
            issue.assignmentRequests[_requestor].status = SubmissionStatus.Accepted;
        } else {
            issue.assignmentRequests[_requestor].status = SubmissionStatus.Rejected;
        }
        bounties.performAction(
            address(this),
            issue.standardBountyId,
            _updatedApplication
        );
        emit AssignmentApproved(_requestor, _repoId, _issueNumber);
    }

    /**
     * @notice Submit work for issue `_issueNumber`
     * @dev add a submission to local state after it's been added to StandardBounties.sol
     * @param _repoId the repo id of the issue
     * @param _issueNumber the issue up for assignment
     * @param _submissionAddress IPFS hash of the Pull Request
     * //param _fulfillmentId retrieved from event after the work is submitted to the bounties contract externally
     */
    function submitWork(
        bytes32 _repoId,
        uint256 _issueNumber,
        string _submissionAddress,
        bytes _signature,
        uint256 _metaTxNonce
        //uint256 _fulfillmentId
    ) external isInitialized
    {
        Issue storage issue = repos[_repoId].issues[_issueNumber];
        require(!issue.fulfilled,"BOUNTY_FULFILLED");
        require(msg.sender == issue.assignee || issue.assignee == address(-1), "USER_NOT_ASSIGNED");
        address[] memory submitter = new address[](1);
        submitter[0] = msg.sender;
        relayer.metaFulfillBounty(
            _signature,
            issue.standardBountyId,
            submitter,
            _submissionAddress,
            _metaTxNonce
        );
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
        bounties.performAction(
            address(this),
            issue.standardBountyId,
            _submissionAddress
        );
        emit WorkSubmitted(_repoId, _issueNumber);
    }

    /**
     * @notice Review work for issue `_issueNumber`
     * @dev add a submission to local state after it's been added to StandardBounties.sol
     * @param _repoId the repo id of the issue
     * @param _issueNumber the issue up for resolution
     * @param _submissionNumber submission index of the submitted work for review
     * @param _approved decision to accept the contribution
     * @param _updatedSubmissionHash IPFS hash of the submission containing optional feedback
     */
    function reviewSubmission(
        bytes32 _repoId,
        uint256 _issueNumber,
        uint256 _submissionNumber,
        bool _approved,
        string _updatedSubmissionHash,
        uint256 _fulfillmentId,
        uint256[] _tokenAmounts
    ) external auth(WORK_REVIEW_ROLE)
    {
        Issue storage issue = repos[_repoId].issues[_issueNumber];

        require(!issue.fulfilled,"BOUNTY_FULFILLED");

        WorkSubmission storage submission = workSubmissions[issue.submissionIndices[_submissionNumber]];
        submission.submissionHash = _updatedSubmissionHash;

        if (_approved) {
            bounties.acceptFulfillment(
                address(this),
                issue.standardBountyId,
                submission.fulfillmentId,
                0,
                _tokenAmounts
            );
            issue.fulfilled = true;
            submission.status = SubmissionStatus.Accepted;
            bounties.performAction(
                address(this),
                issue.standardBountyId,
                _updatedSubmissionHash
            );
            emit SubmissionAccepted(_submissionNumber, _repoId, _issueNumber);
        } else {
            submission.status = SubmissionStatus.Rejected;
            bounties.performAction(
                address(this),
                issue.standardBountyId,
                _updatedSubmissionHash
            );
            emit SubmissionRejected(_submissionNumber, _repoId, _issueNumber);
        }
    }

    function issueBountyTest() public {
        address[] memory issuers = new address[](1);
        issuers[0] = address(this);

        uint256 id = bounties.issueBounty(
            this,
            issuers,
            new address[](0),
            "test",
            block.timestamp + 1000,
            address(0),
            0
        );

        emit BountyTest(id);
    }

    /**
     * @notice Fund issues: `_description`
     * @param _repoIds The ids of the repos in the projects registry
     * @param _issueNumbers an array of bounty indexes
     * @param _bountySizes an array of bounty sizes
     * @param _deadlines an array of bounty deadlines
     * @param _tokenTypes array of currency types: 0=ETH, 1=ETH from vault 20=ERC20
     * @param _tokenContracts an array of token contracts
     * @param _ipfsAddresses a string of ipfs addresses
     * @param _description parsed and display to user when this function is forwarded
     */
    function addBounties(
        bytes32[] _repoIds,
        uint256[] _issueNumbers,
        uint256[] _bountySizes,
        uint256[] _deadlines,
        uint256[] _tokenTypes,
        address[] _tokenContracts,
        string _ipfsAddresses,
        string _description
    ) public payable auth(FUND_ISSUES_ROLE)
    {
        // ensure the transvalue passed equals transaction value
        //checkTransValueEqualsMessageValue(msg.value, _bountySizes,_tokenBounties);
        string memory ipfsHash;
        uint standardBountyId;

        for (uint i = 0; i < _bountySizes.length; i++) {
            ipfsHash = getHash(_ipfsAddresses, i);

            // submit the bounty to the StandardBounties contract
            standardBountyId = _issueBounty(
                ipfsHash,
                _deadlines[i],
                _tokenContracts[i],
                _tokenTypes[i],
                _bountySizes[i]
            );

            //Add bounty to local registry
            _addBounty(
                _repoIds[i],
                _issueNumbers[i],
                standardBountyId,
                _tokenContracts[i],
                _bountySizes[i]
            );
        }
    }

    /**
     * @notice Fund issues open to submissions from anyone: `_description`
     * @param _repoIds The ids of the repos in the projects registry
     * @param _issueNumbers an array of bounty indexes
     * @param _bountySizes an array of bounty sizes
     * @param _deadlines an array of bounty deadlines
     * @param _tokenTypes array of currency types: 0=ETH, 20=ERC20
     * @param _tokenContracts an array of token contracts
     * @param _ipfsAddresses a string of ipfs addresses
     * @param _description parsed and display to user when this function is forwarded
     */
    function addBountiesNoAssignment(
        bytes32[] _repoIds,
        uint256[] _issueNumbers,
        uint256[] _bountySizes,
        uint256[] _deadlines,
        uint256[] _tokenTypes,
        address[] _tokenContracts,
        string _ipfsAddresses,
        string _description
    ) public payable auth(FUND_OPEN_ISSUES_ROLE)
    {
        string memory ipfsHash;
        uint standardBountyId;

        for (uint i = 0; i < _bountySizes.length; i++) {
            ipfsHash = getHash(_ipfsAddresses, i);

            // submit the bounty to the StandardBounties contract
            standardBountyId = _issueBounty(
                ipfsHash,
                _deadlines[i],
                _tokenContracts[i],
                _tokenTypes[i],
                _bountySizes[i]
            );

            //Add bounty to local registry
            _addBounty(
                _repoIds[i],
                _issueNumbers[i],
                standardBountyId,
                _tokenContracts[i],
                _bountySizes[i]
            );

            repos[_repoIds[i]].issues[_issueNumbers[i]].assignee = address(-1);
            emit AwaitingSubmissions(_repoIds[i], _issueNumbers[i]);
        }

    }

    /**
     * @notice Remove funding from issues: `_description`
     * @param _repoIds The ids of the Github repos in the projects registry
     * @param _issueNumbers an array of bounty indexes
     * @param _description Utilized when forwarded to give background to the
     *                     issues up for removal
     */
    function removeBounties(
        bytes32[] _repoIds,
        uint256[] _issueNumbers,
        string _description
    ) public auth(REMOVE_ISSUES_ROLE)
    {
        require(_repoIds.length < 256, ERROR_LENGTH_EXCEEDED);
        require(_issueNumbers.length < 256, ERROR_LENGTH_EXCEEDED);
        require(_repoIds.length == _issueNumbers.length, ERROR_LENGTH_MISMATCH);
        for (uint8 i = 0; i < _issueNumbers.length; i++) {
            _removeBounty(_repoIds[i], _issueNumbers[i]);
        }
    }

    /**
     * @notice Issue curation: `_description`
     * @dev curateIssues(): This function conforms to the upcoming
     *                      specId 2 forwarder interface
     *                      and it is meant to be forwarded to a dot
     *                      voting app instance or another voting app
     *                      that utilizes dynamic forwarding.
     *                      The unused parameters are in place to conform
     *                      to the above specification.
     * @param _description The description of the issue curation
     */
    function curateIssues(
        address[] /*unused_Addresses*/,
        uint256[] issuePriorities,
        uint256[] issueDescriptionIndices,
        string /* unused_issueDescriptions*/,
        string _description,
        uint256[] issueRepos,
        uint256[] issueNumbers,
        uint256 /* unused_curationId */
    ) public auth(CURATE_ISSUES_ROLE)
    {
        bytes32 repoId;
        uint256 issueLength = issuePriorities.length;
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
     * @param _repoId the repo id to check
     * @return _repoId Id for newly added repo
     */
    function isRepoAdded(bytes32 _repoId) public view returns(bool isAdded) {
        uint256 repoIdxVal = repos[_repoId].index;
        if (repoIndex.length == 0)
            return false;
        if (repoIdxVal >= repoIndex.length)
            return false;
        return (repoIndex[repos[_repoId].index] == _repoId);
    }

    /**
     * @notice Returns Applicant array length
     * @param _repoId the repo id of the issue
     * @param _issueNumber the issue up for assignmen
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
     * @param _repoId the repo id of the issue
     * @param _issueNumber the issue up for assignment
     * @param _idx the applicant's position in the array
     * @return  applicant address
     */
    function getApplicant(
        bytes32 _repoId,
        uint256 _issueNumber,
        uint256 _idx
    ) public view returns(address applicant, string application, SubmissionStatus status)
    {
        Issue storage issue = repos[_repoId].issues[_issueNumber];
        applicant = issue.applicants[_idx];
        application = issue.assignmentRequests[applicant].requestHash;
        status = issue.assignmentRequests[applicant].status;
    }

    /**
     * @notice Returns Applicant array length
     * @param _repoId the repo id of the issue
     * @param _issueNumber the issue up for assignmen
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
     * @param _repoId the repo id of the issue
     * @param _issueNumber the issue being worked on
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

    /**
     * @notice update bounty setting values
     * @dev _changeBountySettings(): update app settings by changing contract setting state
     */
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

    /**
     * @notice create a new experience level containing the multiplier and description
     * @dev _addExperienceLevel():  Push new entries into the expMultiplier and expLevel
     *                              arrays
     */
    function _addExperienceLevel(
        uint _multiplier,
        bytes32 _description
    ) internal
    {
        settings.expMultipliers.push(_multiplier);
        settings.expLevels.push(_description);
    }

    /**
     * @notice passes provided info to the linked Standard Bounties contract
     * @dev _issueBounty(): There are two forms of the issueAndContribute call.
     *                      The first is used if an ERC20 token is the bounty currency
     *                      The second is used if ETH is the bounty currency
     */
    function _issueBounty(
        string _ipfsHash,
        uint256 _deadline,
        address _tokenContract,
        uint256 _tokenType,
        uint256 _bountySize
    ) internal returns (uint256 bountyId)
    {
        require(_tokenType != 721, "No ERC 721");
        uint256 registryTokenType;
        if (_tokenType == 0) {
            require(_tokenContract == address(0));
            registryTokenType = _tokenType;
        } else if (_tokenType == 1) {
            require(_tokenContract == address(0));
            registryTokenType = 0;
        } else {
            registryTokenType = _tokenType;
        }

        address[] memory issuers = new address[](1);
        issuers[0] = address(this);

        bountyId = bounties.issueBounty(
                address(this),      // address payable _sender
                issuers,            // address payable [] memory _issuers
                issuers,            // address [] memory _approvers
                _ipfsHash,          // string memory _data
                _deadline,          // uint _deadline
                _tokenContract,     // address _token
                registryTokenType   // uint _tokenVersion
        );

        if (_tokenType > 0) {
            vault.transfer(_tokenContract, this, _bountySize);
            if (registryTokenType != 0) {
                ERC20Token(_tokenContract).approve(bounties, _bountySize);
            }
        }

        if (registryTokenType == 0) {
            bounties.contribute.value(_bountySize)(
                address(this),
                bountyId,
                _bountySize
            );
        } else {
            bounties.contribute(
                address(this),
                bountyId,
                _bountySize
            );
        }
    }

    /**
     * @notice internal function that adds the bounty info to contract state
     * @dev _addBounty():   Creates a new Issue instance in the specified Repo
     *                      and initializes the the state parameters that aren't
     *                      passed in
     */
    function _addBounty(
        bytes32 _repoId,
        uint256 _issueNumber,
        uint _standardBountyId,
        address _tokenContract,
        uint256 _bountySize
    ) internal
    {
        address[] memory emptyAddressArray = new address[](0);
        uint256[] memory emptySubmissionIndexArray = new uint256[](0);
        repos[_repoId].issues[_issueNumber] = Issue(
            _repoId,
            _issueNumber,
            true,
            false,
            _tokenContract,
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
            _bountySize,
            _standardBountyId
        );
    }

    /**
     * @notice remove bounty from StandardBounties and local registry
     * @dev _removeBounty():    First transfers the bounty value from
     *                          the StandardBounties registry back
     *                          to the Project's integrated vault.
     *                          Next resets the issue's contract state.
     * @param _repoId the repo id of the issue
     * @param _issueNumber the issue up for assignment
     */
    function _removeBounty(
        bytes32 _repoId,
        uint256 _issueNumber
    ) internal
    {
        Issue storage issue = repos[_repoId].issues[_issueNumber];
        require(issue.hasBounty, ERROR_BOUNTY_REMOVED);
        require(!issue.fulfilled, ERROR_BOUNTY_FULFILLED);
        uint256[] memory originalAmount = new uint256[](1);
        originalAmount[0] = issue.bountySize;
        bounties.drainBounty(
            address(this),
            issue.standardBountyId,
            0,
            originalAmount
        );
        _returnValueToVault(originalAmount[0], issue.tokenContract);
        issue.hasBounty = false;
        issue.bountySize = 0;
        bounties.changeDeadline(
            address(this),
            issue.standardBountyId,
            0,
            now
        );
        emit BountyRemoved(
            _repoId,
            _issueNumber,
            originalAmount[0]
        );
    }

    function _returnValueToVault(uint256 _amount, address _token) internal {
        if (_token == address(0))
            vault.deposit.value(_amount)(_token, _amount);
        else {
            ERC20Token(_token).approve(vault, _amount);
            vault.deposit(_token, _amount);
        }
    }

    /**
     * @notice parses InfoStrings for the CID hash
     * @dev getHash():  First copies over the first 32 bytes.
     *                  Next copies the remaining 14 bytes and
     *                  and masks the remainder of the word
     * @param _str The raw string to be parsed by the function
     * @param _hashIndex The index of the hash to be parsed from
     *                   the string of combined hashes
     */
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
        // destination in memory for the returned hash
        uint256 dest;
        // source location in memory for the returned hash
        uint256 src;
        // need to offset by 0x20 (32 bytes) to account for the first
        // 32 "header" bytes
        // then copy the first 32 bytes of the hash into the destination location
        assembly {
          dest := add(result,0x20)
          src := add(strBytes,add(0x20,startIndex))
          mstore(dest, mload(src))
        }
        // copy the remaining 14 bytes and ensure the remaining
        // 18 bytes of the word are set to "00" using a mask
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
