pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";

import "@aragon/apps-shared-minime/contracts/MiniMeToken.sol";

import "@tps/apps-address-book/contracts/AddressBook.sol";

import "@aragon/os/contracts/lib/math/SafeMath.sol";

import "@aragon/os/contracts/lib/math/SafeMath64.sol";

import "@tps/test-helpers/contracts/evmscript/ScriptHelpers.sol";


import "@tps/test-helpers/contracts/common/IForwarder.sol";

import "@tps/test-helpers/contracts/lib/misc/Migrations.sol";

// import "@tps/test-helpers/contracts/common/IForwarder.sol";
/* Temp hack to pass coverage until further research */
// interface IForwarderFixed {
//     function isForwarder() external returns (bool);
//     function canForward(address sender, bytes evmCallScript) external returns (bool);
//     function forward(bytes evmCallScript) external;
// }


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
* @title RangeVoting Contract
* @author Arthur Lunn
* @dev This vote is meant to take a set of options and then let
*  holders of a specific token distribute their current voting
*  weight along all options. The code is designed to work as an
*  Aragon app [much thanks to the team for much of the codes structure]
*  but could easily be adapted to other systems.
*  Attention was paid to make the program as generalized as possible.
*******************************************************************************/
contract RangeVoting is IForwarder, AragonApp {
    using ScriptHelpers for bytes;

    using SafeMath for uint256;
    using SafeMath64 for uint64;

    MiniMeToken public token;
    AddressBook public addressBook;
    uint256 public globalCandidateSupportPct; //supportRequiredPct;
    uint256 public minParticipationPct; //minAcceptQuorumPct;
    uint64 public voteTime;

    uint256 constant public PCT_BASE = 10 ** 18; // 0% = 0; 1% = 10^16; 100% = 10^18

    bytes32 constant public CREATE_VOTES_ROLE = keccak256("CREATE_VOTES_ROLE");
    bytes32 constant public ADD_CANDIDATES_ROLE = keccak256("ADD_CANDIDATES_ROLE");
    // TODO: Unused ROLE
    bytes32 constant public MODIFY_PARTICIPATION_ROLE = keccak256("MODIFY_PARTICIPATION_ROLE");

    struct Vote {
        address creator;
        uint64 startDate;
        uint256 snapshotBlock;
        uint256 candidateSupportPct; //aka minAcceptQuorumPct;
        uint256 totalVoters;
        uint256 totalParticipation;
        uint256 externalId;
        string metadata;
        string voteDescription;
        uint256 infoStringLength;
        bytes executionScript;
        uint256 scriptOffset;
        uint256 scriptRemainder;
        bool executed;
        bytes32[] candidateKeys;
        mapping (bytes32 => CandidateState) candidates;
        mapping (address => uint256[]) voters;
    }

    mapping (bytes32 => address ) candidateAddresses;

    struct CandidateState {
        bool added;
        string metadata;
        uint8 keyArrayIndex;
        uint256 voteSupport;
        bytes32 externalId1;
        bytes32 externalId2;
    }

    Vote[] votes;

    event StartVote(uint256 indexed voteId);
    event CastVote(uint256 indexed voteId);
    event UpdateCandidateSupport(string indexed candidateKey, uint256 support);
    event ExecuteVote(uint256 indexed voteId);
    event ExecutionScript(bytes script, uint256 data);
    // Add hash info
    event ExternalContract(uint256 indexed voteId, address addr, bytes32 funcSig);
    event AddCandidate(uint256 voteId, address candidate, uint length);
    event Metadata(string metadata);
    event Location(uint256 currentLocation);
    event Address(address candidate);
    event CandidateQty(uint256 numberOfCandidates);

////////////////
// Constructor
////////////////

   /**
    * @notice Initializes RangeVoting app with `_token.symbol(): string` for
    *         governance, minimum participation of
    *         `(_minParticipationPct - _minParticipationPct % 10^14)
    *         / 10^16`, minimal candidate acceptance of
    *         `(_candidateSupportPct - _candidateSupportPct % 10^14) / 10^16`
    *         and vote duations of `(_voteTime - _voteTime % 86400) / 86400`
    *         day `_voteTime >= 172800 ? 's' : ''`
    * @param _token MiniMeToken address that will be used as governance token
    * @param _minParticipationPct Percentage of voters that must participate in
    *        a vote for it to succeed (expressed as a 10^18 percentage,
    *        (eg 10^16 = 1%, 10^18 = 100%)
    * @param _candidateSupportPct Percentage of cast voting power that must
    *        support a candidate for it to be counted (expressed as a 10^18
    *        percentage, (eg 10^16 = 1%, 10^18 = 100%)
    * @param _voteTime Seconds that a vote will be open for token holders to
    *        vote (unless it is impossible for the fate of the vote to change)
    */
    function initialize(
        AddressBook _addressBook,
        MiniMeToken _token,
        uint256 _minParticipationPct,
        uint256 _candidateSupportPct,
        uint64 _voteTime
    ) external onlyInit
    {
        initialized();
        require(_minParticipationPct > 0); // solium-disable-line error-reason
        require(_minParticipationPct <= PCT_BASE); // solium-disable-line error-reason
        require(_minParticipationPct >= _candidateSupportPct); // solium-disable-line error-reason
        token = _token;
        addressBook = _addressBook;
        minParticipationPct = _minParticipationPct;
        globalCandidateSupportPct = _candidateSupportPct;
        voteTime = _voteTime;
        votes.length += 1;
    }

///////////////////////
// Voting functions
///////////////////////


    /**
    * @notice Create a new range vote about "`_metadata`"
    * @param _executionScript EVM script to be executed on approval
    * @param _metadata Vote metadata
    * @return voteId Id for newly created vote
    */
    function newVote(bytes _executionScript, string _metadata)
        external auth(CREATE_VOTES_ROLE) returns (uint256 voteId)
    {
        return _newVote(_executionScript, _metadata);
    }

    /**
    * @notice Cast a range vote.
    * @param _voteId id for vote structure this 'ballot action' is connected to
    * @param _supports Array of support weights in order of their order in
    *                  `votes[_voteId].candidateKeys`, sum of all supports
    *                  must be less than `token.balance[msg.sender]`.
    */
    function vote(uint256 _voteId, uint256[] _supports) external {
        require(canVote(_voteId, msg.sender)); // solium-disable-line error-reason
        _vote(_voteId, _supports, msg.sender);
    }

    /**
    * @notice Execute a range vote. After this step, navigate to the Allocations app and select the Distribute Allocation action from an account to complete the execution.
    * @param _voteId Id for vote
    */
    // function executeVote(uint256 _voteId) isInitialized external {
    function executeVote(uint256 _voteId) external {
        require(canExecute(_voteId), "vote not meeting execution requirements");
        _executeVote(_voteId);
    }

    /**
    * @notice `addCandidate` allows the `ADD_CANDIDATES_ROLE` to add candidates
    *         (or options) to the current range vote.
    * @param _voteId id for vote structure this 'ballot action' is connected to
    * @param _metadata Any additional information about the candidate.
    *        Base implementation does not use this parameter.
    * @param _description This is the string that will be displayed along the
    *        option when voting
    */
    function addCandidate(uint256 _voteId, string _metadata, address _description, bytes32 eId1, bytes32 eId2)
    public auth(ADD_CANDIDATES_ROLE)
    {
        // Get vote and candidate into storage
        Vote storage voteInstance = votes[_voteId];
        bytes32[] storage keys = voteInstance.candidateKeys;
        bytes32 cKey = keccak256(abi.encodePacked(_description));
        CandidateState storage candidate = voteInstance.candidates[cKey];
        // Make sure that this candidate has not already been added
        require(candidate.added == false); // solium-disable-line error-reason
        // Set all data for the candidate
        candidate.added = true;
        candidate.keyArrayIndex = uint8(keys.length);
        candidate.metadata = _metadata;
        candidate.externalId1 = eId1;
        candidate.externalId2 = eId2;
        // double check
        candidateAddresses[cKey] = _description;
        keys.push(cKey);
        voteInstance.candidateKeys = keys;
        voteInstance.infoStringLength += bytes(_metadata).length;
        emit AddCandidate(_voteId, candidateAddresses[cKey], voteInstance.candidateKeys.length);
    }

    /**
    * @notice `getCandidate` serves as a basic getter using the description
    *         to return the struct data.
    * @param _voteId id for vote structure this 'ballot action' is connected to
    * @param _candidateIndex The candidate descrciption of the candidate.
    */
    function getCandidate(uint256 _voteId, uint256 _candidateIndex) // solium-disable-line function-order
    external view returns(address candidateAddress, uint256 voteSupport, string metadata, bytes32 externalId1, bytes32 externalId2)
    {
        Vote storage voteInstance = votes[_voteId];
        CandidateState storage candidate = voteInstance.candidates[voteInstance.candidateKeys[_candidateIndex]];
        candidateAddress = candidateAddresses[voteInstance.candidateKeys[_candidateIndex]];
        voteSupport = candidate.voteSupport;
        metadata = candidate.metadata;
        externalId1 = candidate.externalId1;
        externalId2 = candidate.externalId2;
    }

    /**
    * @notice `getCandidateDescription` serves as a basic getter using the key
    *         to return the struct data.
    * @param _key The bytes32 key used when adding the candidate.
    */
    function getCandidateDescription(bytes32 _key) // solium-disable-line function-order
    external view returns(address)
    {
        return(candidateAddresses[_key]);
    }

///////////////////////
// IForwarder functions
///////////////////////

    /**
    * @notice `isForwarder` is a basic helper function used to determine
    *         if a function implements the IForwarder interface
    * @dev IForwarder interface conformance
    * @return always returns true
    */
    function isForwarder() public pure returns (bool) {
        return true;
    }

    /**
    * @notice Used to ensure that the permissions are being handled properly
    *         for the range vote forwarding
    * @dev IForwarder interface conformance
    * @param _sender Address of the entity trying to forward
    * @return True is `_sender` has correct permissions
    */
    function canForward(address _sender, bytes /*_evmCallScript*/) public view returns (bool) {
        return canPerform(_sender, CREATE_VOTES_ROLE, arr());
    }

    // * @param _evmCallScript Not used in this implementation

        /**
    * @notice Creates a vote to execute the desired action
    * @dev IForwarder interface conformance
    * @param _evmScript Start vote with script
    */
    function forward(bytes _evmScript) public { // solium-disable-line function-order
        require(canForward(msg.sender, _evmScript)); // solium-disable-line error-reason
        _newVote(_evmScript, ""); /*, true);*/
    }

///////////////////////
// View state functions
///////////////////////

    /**
    * @notice `canVote` is used to check whether an address is elligible to
    *         cast a range vote in a given range vote action.
    * @param _voteId The ID of the Vote on which the vote would be cast.
    * @param _voter The address of the entity trying to vote
    * @return True is `_voter` has a vote token balance and vote is open
    */
    function canVote(uint256 _voteId, address _voter) public view returns (bool) {
        Vote storage voteInstance = votes[_voteId];

        return _isVoteOpen(voteInstance) && token.balanceOfAt(_voter, voteInstance.snapshotBlock) > 0;
    }

    /**
    * @notice `canExecute` is used to check that the participation has been met
    *         and the vote has reached it's end before the execute
    *         function is called.
    * @param _voteId id for vote structure this 'ballot action' is connected to
    * @return True if the vote is elligible for execution.
    */
    function canExecute(uint256 _voteId) public view returns (bool) {
        Vote storage voteInstance = votes[_voteId];
        if (voteInstance.executed)
            return false;
         // vote ended?
        if (_isVoteOpen(voteInstance))
          return false;
        bytes32[] storage cKeys = voteInstance.candidateKeys;
        uint256 i = 0;
        for (i; i < cKeys.length; i++) {
            bytes32 cKey = cKeys[i];
            CandidateState storage candidateState = voteInstance.candidates[cKey];
             // has candidate support?
            if (!_isValuePct(candidateState.voteSupport, voteInstance.totalParticipation, voteInstance.candidateSupportPct))
                return false;
        }
         // has minimum participation threshold been reached?
        if (!_isValuePct(voteInstance.totalParticipation, voteInstance.totalVoters, minParticipationPct))
            return false;
        return true;
    }

    /**
    * @notice `getVote` simply splits all of the data elements out of a vote
    *         struct and returns the individual values.
    * @param _voteId The ID of the Vote struct in the `votes` array
    */
    function getVote(uint256 _voteId) public view returns
    (
        bool open,
        address creator,
        uint64 startDate,
        uint256 snapshotBlock,
        uint256 candidateSupport,
        uint256 totalVoters,
        uint256 totalParticipation,
        uint256 externalId,
        bytes executionScript, // script,
        bool executed,
        string voteDescription
    ) { // solium-disable-line lbrace
        Vote storage voteInstance = votes[_voteId];

        open = _isVoteOpen(voteInstance);
        creator = voteInstance.creator;
        startDate = voteInstance.startDate;
        snapshotBlock = voteInstance.snapshotBlock;
        candidateSupport = voteInstance.candidateSupportPct;
        totalVoters = voteInstance.totalVoters;
        totalParticipation = voteInstance.totalParticipation;
        executionScript = voteInstance.executionScript;
        executed = voteInstance.executed;
        externalId = voteInstance.externalId;
        voteDescription = voteInstance.voteDescription;
    }

        /**
    * @notice `getCandidateLength` returns the total number of candidates for
    *         a given vote.
    * @param _voteId The ID of the Vote struct in the `votes` array
    */
    function getCandidateLength(uint256 _voteId) public view returns
    ( uint totalCandidates ) { // solium-disable-line lbrace
        totalCandidates = votes[_voteId].candidateKeys.length;
    }

    /**
    * @notice `getVoteMetadata` simply pulls the vote metadata out of a vote
    *         struct and returns the individual value.
    * @param _voteId The ID of the Vote struct in the `votes` array
    */
    function getVoteMetadata(uint256 _voteId) public view returns (string) {
        return votes[_voteId].metadata;
    }

    /**
    * @notice `getVoterState` allows a user to get the vote weights for a given
    *         voter.
    * @param _voteId The ID of the Vote struct in the `votes` array.
    * @param _voter The voter whose weights will be returned
    */
    function getVoterState(uint256 _voteId, address _voter) public view returns (uint256[]) {
        return votes[_voteId].voters[_voter];
    }

///////////////////////
// Internal functions
///////////////////////

    /**
    * @notice `_newVote` starts a new vote and adds it to the votes array.
    *         votes are not started with a vote from the caller, as candidates
    *         and candidate weights need to be supplied.
    * @param _executionScript The script that will be executed when
    *        this vote closes. Script is of the following form:
    *            [ specId (uint32: 4 bytes) ] many calls with this structure ->
    *            [ to (address: 20 bytes) ]
    *            [calldataLength (uint32: 4 bytes) ]
    *            [ function hash (uint32: 4 bytes) ]
    *            [ calldata (calldataLength bytes) ]
    *        In order to work with a range vote the execution script must contain
    *        Arrays as its first six parameters. Non-string array lengths must all equal candidateLength
    *        The first Array is generally a list of identifiers (bytes32 or address)
    *        The second array will be composed of support value (uint256).
    *        The third array will be end index for each candidates Information within the infoString (optional uint256)
    *        The fourth array is a string of concatenated candidate information, the infoString (optional string)
    *        The fifth array is an array of identification keys (optional uint256)
    *        The sixth array is a second array of identification keys, usually mapping to a second level (optional uint256)
    *        The seventh parameter is used as the identifier for this vote. (uint256)
    *        See ExecutionTarget.sol in the test folder for an example  forwarded function (setSignal)
    * @param _metadata The metadata or vote information attached to this vote
    * @return voteId The ID(or index) of this vote in the votes array.
    */
    function _newVote(bytes _executionScript, string _metadata) internal
    isInitialized returns (uint256 voteId)
    {
        voteId = votes.length++;
        Vote storage voteInstance = votes[voteId];
        voteInstance.executionScript = _executionScript;
        voteInstance.creator = msg.sender;
        voteInstance.startDate = uint64(block.timestamp); // solium-disable-line security/no-block-members
        voteInstance.metadata = _metadata;
        voteInstance.infoStringLength = 0;
        voteInstance.snapshotBlock = getBlockNumber() - 1; // avoid double voting in this very block
        voteInstance.totalVoters = token.totalSupplyAt(voteInstance.snapshotBlock);
        voteInstance.candidateSupportPct = globalCandidateSupportPct;
        voteInstance.scriptOffset = 0;
        voteInstance.scriptRemainder = 0;
        require(_executionScript.uint32At(0x0) == 1); // solium-disable-line error-reason
        if (_executionScript.length != 4) {
            uint256 scriptOffset;
            uint256 scriptRemainder;
            (scriptOffset, scriptRemainder) = _extractCandidates(_executionScript, voteId);
            voteInstance.scriptOffset = scriptOffset;
            voteInstance.scriptRemainder = scriptRemainder;
        }
        // First Static Parameter in script parsed for the externalId
        voteInstance.externalId = _goToParamOffset(8, _executionScript) - 0x20;
        emit ExternalContract(voteId, _executionScript.addressAt(0x4),_executionScript.bytes32At(0x0));
        emit StartVote(voteId);
    }

    function _goToParamOffset(uint256 _paramNum, bytes _executionScript) internal pure returns(uint256 paramOffset) {
        /*
        param numbers and what they map to:
        1. candidate addresses
        2. Supports values
        3. Info String indexes
        4. Info String length
        5. Description
        6. Level 1 external references
        7. level 2 external references
        */
        uint256 startOffset = 0x04 + 0x14 + 0x04;
        paramOffset = _executionScript.uint256At(startOffset + 0x04 + (0x20 * (_paramNum - 1) )) + 0x20;
    }

    function substring(
        bytes strBytes,
        uint startIndex,
        uint endIndex
    ) internal pure returns (string)
    {
        // first char is at location 0
        //IPFS addresses span from 0 (startindex) to 46 (endIndex)
        bytes memory result = new bytes(endIndex-startIndex);
        for (uint i = startIndex; i < endIndex; i++) {
            result[i-startIndex] = strBytes[i];
        }
        return string(result);
    }

    function _iterateExtraction(uint256 _voteId, bytes _executionScript, uint256 _currentOffset, uint256 _candidateLength) internal {
        uint256 currentOffset = _currentOffset;
        address currentCandidate;
        string memory info;
        uint256 infoEnd;
        bytes32 externalId1;
        bytes32 externalId2;
        uint256 idOffset;
        uint256 infoStart = _goToParamOffset(4,_executionScript) + 0x20;
        //Location(infoStart);
        emit CandidateQty(_candidateLength);
        for (uint256 i = 0 ; i < _candidateLength; i++) {
            currentCandidate = _executionScript.addressAt(currentOffset + 0x0C);
            emit Address(currentCandidate);
            //find the end of the infoString using the relative arg positions
            infoEnd = infoStart + _executionScript.uint256At(currentOffset + (0x20 * 2 * (_candidateLength + 1) ));
            info = substring(_executionScript, infoStart, infoEnd);
            //Metadata(info);
            //Location(infoEnd);
            currentOffset = currentOffset + 0x20;
            // update the index for the next iteration
            infoStart = infoEnd;
            // store candidate external IDs
            idOffset = _goToParamOffset(5, _executionScript) + 0x20 * (i + 1);
            externalId1 = bytes32(_executionScript.uint256At(idOffset));
            idOffset = _goToParamOffset(6, _executionScript) + 0x20 * (i + 1);
            externalId2 = bytes32(_executionScript.uint256At(idOffset));

            addCandidate(_voteId, info, currentCandidate, externalId1, externalId2);
        }
    }

    /**
    * @dev This function needs to work with strings instead of addresses but it doesn't
    *      This fits our current use case better and string manipulation is harder
    *      since there's more like... dynamic-ness.
            //TODO Update the above dev info
    */
    function _extractCandidates(bytes _executionScript, uint256 _voteId) internal returns(uint256 currentOffset, uint256 calldataLength) {
        Vote storage voteInstance = votes[_voteId];
        // in order to find out the total length of our call data we take the 3rd
        // relevent byte chunk (after the specid and the target address)
        calldataLength = uint256(_executionScript.uint32At(0x4 + 0x14));
        // Since the calldataLength is 4 bytes the start offset is
        uint256 startOffset = 0x04 + 0x14 + 0x04;
        // The first parameter is located at a byte depth indicated by the first
        // word in the calldata (which is located at the startOffset + 0x04 for the function signature)
        // so we have:
        // start offset (spec id + address + calldataLength) + param offset + function signature
        // note:function signature length (0x04) added in both contexts: grabbing the offset value and the outer offset calculation
        uint256 firstParamOffset = _goToParamOffset(1, _executionScript);
        uint256 fifthParamOffset = _goToParamOffset(5, _executionScript);

        currentOffset = firstParamOffset;

        // compute end of script / next location and ensure there's no
        // shenanigans
        require(startOffset + calldataLength <= _executionScript.length); // solium-disable-line error-reason
        // The first word in the param slot is the length of the array

        // obtain the beginning index of the infoString
        //uint256 infoStart = _goToParamOffset(4,_executionScript) + 0x20;
        //Location(infoStart);
        uint256 candidateLength = _executionScript.uint256At(currentOffset);


        currentOffset = currentOffset + 0x20;
        // This has the potential to be too gas expensive to ever happen.
        // Upper limit of candidates should be checked against this function
        _iterateExtraction(_voteId, _executionScript, currentOffset, candidateLength);
        uint256 descriptionStart = fifthParamOffset + 0x20;
        uint256 descriptionEnd = descriptionStart + (_executionScript.uint256At(fifthParamOffset));
        voteInstance.voteDescription = substring(_executionScript, descriptionStart, descriptionEnd);
        // Skip the next param since it's also determined by this contract
        // In order to do this we move the offset one word for the length of the param
        // and we move the offset one word for each param.
        //currentOffset = currentOffset.add(_executionScript.uint256At(currentOffset).mul(0x20));
        currentOffset = fifthParamOffset;
        // The offset represents the data we've already accounted for; the rest is what will later
        // need to be copied over.

        calldataLength = calldataLength.sub(currentOffset);
        /*

        */
    }

    /*
    * @notice `_vote` is the internal function that allows a token holder to
    *         caste a vote on the current options.
    * @param _voteId id for vote structure this 'ballot action' is connected to
    * @param _supports Array of support weights in order of their order in
    *        `votes[_voteId].candidateKeys`, sum of all supports must be less
    *        than `token.balance[msg.sender]`.
    * @param _voter The address of the entity "casting" this vote action.
    */
    function _vote(
        uint256 _voteId,
        uint256[] _supports,
        address _voter
    ) internal
    {
        Vote storage voteInstance = votes[_voteId];

        // this could re-enter, though we can asume the
        // governance token is not maliciuous
        uint256 voterStake = token.balanceOfAt(_voter, voteInstance.snapshotBlock);
        uint256 totalSupport = 0;

        emit CastVote(_voteId);


        uint256 voteSupport;
        uint256[] storage oldVoteSupport = voteInstance.voters[msg.sender];
        bytes32[] storage cKeys = voteInstance.candidateKeys;

        uint256 i = 0;
        // This is going to cost a lot of gas... it'd be cool if there was
        // a better way to do this.
        for (i; i < oldVoteSupport.length; i++) {
            totalSupport = totalSupport.add(_supports[i]);
            // Might make sense to move this outside the for loop
            // Probably safer here but some gas calculations should be done
            require(totalSupport <= voterStake); // solium-disable-line error-reason
            voteSupport = voteInstance.candidates[cKeys[i]].voteSupport;
            voteInstance.totalParticipation = voteInstance.totalParticipation.sub(oldVoteSupport[i]);
            voteSupport = voteSupport.sub(oldVoteSupport[i]);
            voteSupport = voteSupport.add(_supports[i]);
            voteInstance.totalParticipation = voteInstance.totalParticipation.add(_supports[i]);
            voteInstance.candidates[cKeys[i]].voteSupport = voteSupport;
        }
        for (i; i < _supports.length; i++) {
            totalSupport = totalSupport.add(_supports[i]);
            require(totalSupport <= voterStake); // solium-disable-line error-reason
            voteSupport = voteInstance.candidates[cKeys[i]].voteSupport;
            voteSupport = voteSupport.add(_supports[i]);
            voteInstance.totalParticipation = voteInstance.totalParticipation.add(_supports[i]);
            voteInstance.candidates[cKeys[i]].voteSupport = voteSupport;
        }

        voteInstance.voters[msg.sender] = _supports;
    }

    function addDynamicElements(bytes script, uint256 offset, uint256 numberOfCandidates,uint256 strLength) internal returns(bytes) {
        uint256 secondDynamicElementLocation = 32 + offset + (numberOfCandidates * 32);
        uint256 thirdDynamicElementLocation = secondDynamicElementLocation + 32 + (numberOfCandidates * 32);
        uint256 fourthDynamicElementLocation = thirdDynamicElementLocation + 32 + (numberOfCandidates * 32);
        uint256 fifthDynamicElementLocation = fourthDynamicElementLocation + strLength / 32 * 32 + (strLength % 32 == 0 ? 32 : 64);
        uint256 sixthDynamicElementLocation = fifthDynamicElementLocation + 32 + (numberOfCandidates * 32);

        assembly {
            mstore(add(script, 96), secondDynamicElementLocation)
            mstore(add(script, 128), thirdDynamicElementLocation)
            mstore(add(script, 160), fourthDynamicElementLocation)
            mstore(add(script, 192), fifthDynamicElementLocation)
            mstore(add(script, 224), sixthDynamicElementLocation)
        }

        return script;
    }

    function addAddressesAndVotes(
        uint256 _voteId,
        bytes script,
        uint256 numberOfCandidates,
        uint256 dynamicOffset
        ) internal returns(uint256 offset)
        {
                // Set the initial offest after the static parameters
        offset = 64 + dynamicOffset;

        assembly { // solium-disable-line security/no-inline-assembly
            mstore(add(script, offset), numberOfCandidates)
        }

        offset += 32;

        // Copy all candidate addresses
        for (uint256 i = 0; i < numberOfCandidates; i++) {
            bytes32 canKey = votes[_voteId].candidateKeys[i];
            uint256 candidateData = uint256(candidateAddresses[canKey]);
            assembly {
                mstore(add(script, offset), candidateData)
            }
            offset += 32;
        }

        assembly { // solium-disable-line security/no-inline-assembly
            mstore(add(script, offset), numberOfCandidates)
        }

        offset += 32;

        // Copy all support data
        for (i = 0; i < numberOfCandidates; i++) {
            uint256 supportsData = votes[_voteId].candidates[votes[_voteId].candidateKeys[i]].voteSupport;

            assembly { // solium-disable-line security/no-inline-assembly
                mstore(add(script, offset), supportsData)
            }
            offset += 32;
        }
        return offset;
    }

    /**
    * @notice `_executeVote` executes the provided script for this vote and
    *         passes along the candidate data to the next function.
    * @return voteId The ID(or index) of this vote in the votes array.
    * @dev This function needs to be cleaned up ALOT; also generalized
    *      for functions that have an unknown number of params
    */
    function _executeVote(uint256 _voteId) internal {
        Vote storage voteInstance = votes[_voteId];

        voteInstance.executed = true;
        uint256 candidateLength = voteInstance.candidateKeys.length;
        //bytes memory infoString = getInfoString(_voteId);
        bytes memory executionScript = new bytes(32);
        executionScript = voteInstance.executionScript;
        uint256 dynamicOffset = executionScript.uint256At(32);
        // Doesn't fit in local storage but here for reference
        //uint256 firstDynamicElementLocation = executionScript.uint256At(32);
        //uint256 secondDynamicElementLocation = 32 + dynamicOffset + (candidateLength * 32);
        //uint256 thirdDynamicElementLocation = secondDynamicElementLocation + 32 + (candidateLength * 32);
        //uint256 fourthDynamicElementLocation = thirdDynamicElementLocation + 32 + (candidateLength * 32);
        // Doesn't fit in local storage but here for reference
        //uint256 staticParamLength = firstDynamicElementLocation - 64;
        // The total length of the new script will be two 32 byte spaces
        // for each candidate (one for support one for address)
        // as well as 3 32 byte spaces for
        // the header (specId 0x4, target address 0x14, calldata 0x4, function hash 0x4)
        // and the two dynamic param locations
        // as well as additional space for the staticParameters
        // Seperate variable isn't used here to save storage space

        //uint256 callDataLength = 32 * (3 * (candidateLength + 4)) + executionScript.uint256At(32) - 60;
        uint256 infoStrLength = voteInstance.infoStringLength;
        uint256 callDataLength = 196 + dynamicOffset + candidateLength * 160;
        callDataLength += (infoStrLength / 32) * 32 + (infoStrLength % 32 == 0 ? 0 : 32);
        bytes memory callDataLengthMem = new bytes(32);
        assembly { // solium-disable-line security/no-inline-assembly
            mstore(add(callDataLengthMem, 32), callDataLength)
        }
        // script is callDataLength long plus 28 bytes for the "header" - function
        bytes memory script = new bytes(callDataLength + 28);
        // Copy header information and first dynamic location as it's unchanged
        script.copy(executionScript.getPtr() + 32,0, 64);

        //fix the calldataLength
        memcpyshort((script.getPtr() + 56), callDataLengthMem.getPtr() + 60, 4);

        // Add second, 3rd and fourth dynamic element location as it may have changed
        addDynamicElements(script, dynamicOffset, candidateLength, infoStrLength);
        // Copy over all static parameters
        script.copy(executionScript.getPtr() + 256, 224, dynamicOffset - 224);

        uint256 offset = addAddressesAndVotes(_voteId, script, candidateLength, dynamicOffset);

        offset = addInfoString(_voteId, script, candidateLength, offset);

        addExternalIds(_voteId, script, candidateLength, offset);

        emit ExecutionScript(script, callDataLength);

        runScript(script, new bytes(0), new address[](0));
        emit ExecuteVote(_voteId);
    }

    function addInfoString(uint256 _voteId, bytes script, uint256 numberOfCandidates, uint256 _offset) internal returns (uint256 newOffset) {
        Vote storage voteInstance = votes[_voteId];
        uint256 infoStringLength = voteInstance.infoStringLength;
        bytes memory infoString = new bytes(infoStringLength);
        bytes memory candidateMetaData;
        uint256 metaDataLength;
        uint256 strOffset = 0;
        newOffset = _offset;

        assembly { // solium-disable-line security/no-inline-assembly
            mstore(add(script, newOffset), numberOfCandidates)
        }

        newOffset += 32;

        for (uint256 i = 0; i < numberOfCandidates; i++) {
            bytes32 canKey = voteInstance.candidateKeys[i];
            candidateMetaData = bytes(voteInstance.candidates[canKey].metadata);
            infoString.copy(candidateMetaData.getPtr() + 32, strOffset, candidateMetaData.length);
            strOffset += candidateMetaData.length;
            metaDataLength = candidateMetaData.length;

            assembly { // solium-disable-line security/no-inline-assembly
                mstore(add(script, newOffset), metaDataLength)
            }

            newOffset += 32;
        }

        assembly { // solium-disable-line security/no-inline-assembly
                mstore(add(script, newOffset), infoStringLength)
        }

        //newOffset += 1;

        script.copy(infoString.getPtr() + 32, newOffset, infoStringLength);

        newOffset += infoStringLength / 32 * 32 + (infoStringLength % 32 == 0 ? 0 : 32);
    }

    function addExternalIds(
        uint256 _voteId,
        bytes script,
        uint256 numberOfCandidates,
        uint256 _offset
        ) internal returns(uint256 offset)
        {
                // Set the initial offest after the static parameters
        offset = _offset + 32;

        assembly { // solium-disable-line security/no-inline-assembly
            mstore(add(script, offset), numberOfCandidates)
        }

        offset += 32;

        // Copy all candidate addresses
        for (uint256 i = 0; i < numberOfCandidates; i++) {
            //bytes32 canKey = votes[_voteId].candidateKeys[i];
            bytes32 externalId1 = votes[_voteId].candidates[votes[_voteId].candidateKeys[i]].externalId1;
            assembly {
                mstore(add(script, offset), externalId1)
            }
            offset += 32;
        }

        assembly { // solium-disable-line security/no-inline-assembly
            mstore(add(script, offset), numberOfCandidates)
        }

        offset += 32;

        // Copy all support data
        for (i = 0; i < numberOfCandidates; i++) {
            bytes32 externalId2 = votes[_voteId].candidates[votes[_voteId].candidateKeys[i]].externalId2;

            assembly { // solium-disable-line security/no-inline-assembly
                mstore(add(script, offset), externalId2)
            }
            offset += 32;
        }
        return offset;
    }

    function memcpyshort(uint _dest, uint _src, uint _len) internal pure {
        uint256 src = _src;
        uint256 dest = _dest;
        uint256 len = _len;

        require(_len < 32, "_len should be less than 32");
        // Copy remaining bytes
        uint mask = 256 ** (32 - len) - 1;
        assembly { // solium-disable-line security/no-inline-assembly
            let srcpart := and(mload(src), not(mask))
            let destpart := and(mload(dest), mask)
            mstore(dest, or(destpart, srcpart))
        }
    }

    /**
    * @dev Calculates whether `_value` is at least a percent `_pct` over `_total`
    */
    function _isVoteOpen(Vote storage voteArg) internal view returns (bool) {
        return uint64(block.timestamp) < (voteArg.startDate.add(voteTime)) && !voteArg.executed; // solium-disable-line security/no-block-members
    }

    /**
    * @dev Calculates whether `_value` is at least a percentage `_pct` of `_total`
    */
    function _isValuePct(uint256 _value, uint256 _total, uint256 _pct)
        internal pure returns (bool)
    {
        // if (_total == 0) {
        if (_value == 0 && _total > 0)
            return false;
        // }

        uint256 m = _total.mul(_pct);
        uint256 v = m / PCT_BASE;
        // uint256 computedPct = _value.mul(PCT_BASE) / _total;

        // return computedPct >= _pct;

        // If division is exact, allow same value,
        // otherwise require value to be greater
        return m % PCT_BASE == 0 ? _value >= v : _value > v;
    }
}
