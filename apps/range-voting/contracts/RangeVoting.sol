pragma solidity 0.4.18;

import "@aragon/os/contracts/apps/AragonApp.sol";

import "@aragon/os/contracts/lib/minime/MiniMeToken.sol";

import "@aragon/os/contracts/lib/zeppelin/math/SafeMath.sol";

import "@aragon/os/contracts/lib/zeppelin/math/SafeMath64.sol";

// import "@aragon/os/contracts/common/IForwarder.sol";

//import "./misc/CustomScriptHelpers.sol";

// import "@aragon/os/contracts/common/IForwarder.sol";
/* Temp hack to pass coverage until further research */
interface IForwarderFixed {
    function isForwarder() public returns (bool);
    function canForward(address sender, bytes evmCallScript) public returns (bool);
    function forward(bytes evmCallScript) public;
}

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
* @title RangeVoting Contract
* @author Arthur Lunn
* @dev This vote is meant to take a set of options and then let
*  holders of a specific token distribute their current voting
*  weight along all options. The code is designed to work as an
*  Aragon app [much thanks to the team for much of the codes structure]
*  but could easily be adapted to other systems.
*  Attention was paid to make the program as generalized as possible.
*******************************************************************************/
contract RangeVoting is IForwarderFixed, AragonApp {
    //using CustomScriptHelpers for bytes;

    using SafeMath for uint256;
    using SafeMath64 for uint64;

    MiniMeToken public token;
    uint256 public globalCandidateSupportPct;
    uint256 public minParticipationPct;
    uint64 public voteTime;

    uint256 constant public PCT_BASE = 10 ** 18;

    bytes32 constant public CREATE_VOTES_ROLE = keccak256("CREATE_VOTES_ROLE");
    bytes32 constant public ADD_CANDIDATES_ROLE = keccak256("ADD_CANDIDATES_ROLE");
    bytes32 constant public MODIFY_PARTICIPATION_ROLE = keccak256("MODIFY_CANDIDATE_SUPPORT_ROLE");

    struct Vote {
        address creator;
        uint64 startDate;
        uint256 snapshotBlock;
        uint256 candidateSupportPct;
        uint256 totalVoters;
        string metadata;
        bytes executionScript;
        uint256 scriptOffset;
        uint256 scriptRemainder;
        bool executed;
        bytes32[] candidateKeys;
        mapping (bytes32 => CandidateState) candidates;
        mapping (address => uint256[]) voters;
    }

    mapping (bytes32 => address ) candidateDescriptions;

    struct CandidateState {
        bool added;
        bytes metadata;
        uint8 keyArrayIndex;
        uint256 voteSupport;
        //string description;
    }

    Vote[] votes;

    event StartVote(uint256 indexed voteId);
    event CastVote(
        //uint256 indexed voteId,
        //address indexed voter,
        uint256 supports,
        bytes desc,
        bool added
        //uint256 stake
    );
    event UpdateCandidateSupport(string indexed candidateKey, uint256 support);
    event ExecuteVote(uint256 indexed voteId);
    event ChangeCandidateSupport(uint256 candidateSupportPct);
    event ExecutionScript(bytes script, uint256 data);
    event AddCandidate(address candidate);

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
        MiniMeToken _token,
        uint256 _minParticipationPct,
        uint256 _candidateSupportPct,
        uint64 _voteTime
    ) external onlyInit
    {
        initialized();

        require(_minParticipationPct > 0);
        require(_minParticipationPct <= PCT_BASE);
        require(_minParticipationPct >= _candidateSupportPct);

        token = _token;
        minParticipationPct = _minParticipationPct;
        globalCandidateSupportPct = _candidateSupportPct;
        voteTime = _voteTime;

        votes.length += 1;
    }

///////////////////////
// Voting functions
///////////////////////


    /**
    * @notice Create a new vote about "`_metadata`"
    * @param _executionScript EVM script to be executed on approval
    * @return voteId id for newly created vote
    */
    function newVote(bytes _executionScript, string _metadata) external
    auth(CREATE_VOTES_ROLE) returns (uint256 voteId)
    {
        return _newVote(_executionScript, _metadata);
    }

    /**
    * @notice Allows a token holder to caste a vote on the current options.
    * @param _voteId id for vote structure this 'ballot action' is connected to
    * @param _supports Array of support weights in order of their order in
    *                  `votes[_voteId].candidateKeys`, sum of all supports
    *                  must be less than `token.balance[msg.sender]`.
    */
    function vote(uint256 _voteId, uint256[] _supports) external {
        require(canVote(_voteId, msg.sender));
        _vote(_voteId, _supports, msg.sender);
    }

    /**
    * @notice Execute the result of vote #`_voteId`
    * @param _voteId Id for vote
    */
    function executeVote(uint256 _voteId) external {
        require(canExecute(_voteId));
        /* solium-disable-next-line */
        _executeVote(_voteId);
    }

    /**
    * @param _voteId id for vote structure this 'ballot action' is connected to
    * @notice `addCandidate` allows the `ADD_CANDIDATES_ROLE` to add candidates
    *         (or options) to the current vote.
    * @param _voteId id for vote structure this 'ballot action' is connected to
    * @param _metadata Any additional information about the candidate.
    *        Base implementation does not use this parameter.
    * @param _description This is the string that will be displayed along the
    *        option when voting
    */
    function addCandidate(uint256 _voteId, bytes _metadata, address _description)
    public auth(ADD_CANDIDATES_ROLE)
    {
        // Get vote and candidate into storage
        Vote storage vote = votes[_voteId];
        bytes32 cKey = keccak256(_description);
        CandidateState storage candidate = vote.candidates[cKey];
        // Make sure that this candidate has not already been added
        require(candidate.added == false);
        // Set all data for the candidate
        candidate.added = true;
        candidate.keyArrayIndex = uint8(vote.candidateKeys.length++);
        candidate.metadata = _metadata;
        // double check
        candidateDescriptions[cKey] = _description;
        vote.candidateKeys[candidate.keyArrayIndex] = cKey;
    }

    /**
    * @notice `getCandidate` serves as a basic getter using the description
    *         to return the struct data.
    * @param _voteId id for vote structure this 'ballot action' is connected to
    * @param _description The candidate descrciption of the candidate.
    */
    function getCandidate(uint256 _voteId, address _description)
    external view returns(bool, bytes, uint8, uint256)
    {
        Vote storage vote = votes[_voteId];
        CandidateState storage candidate = vote.candidates[keccak256(_description)];
        return(
            candidate.added,
            candidate.metadata,
            candidate.keyArrayIndex,
            candidate.voteSupport
        );
    }

    /**
    * @notice `getCandidate` serves as a basic getter using the key
    *         to return the struct data.
    * @param _key The bytes32 key used when adding the candidate.
    */
    function getCandidateDescription(bytes32 _key)
    external view returns(address)
    {
        return(candidateDescriptions[_key]);
    }

///////////////////////
// IForwarder functions
///////////////////////

    /**
    * @notice `isForwader` is a basic helper function used to determine
    *         if a function implements the IForwarder interface
    * @dev IForwarder interface conformance
    * @return always returns true
    */
    function isForwarder() public returns (bool) {
        return true;
    }

    /**
    * @notice Creates a vote to execute the desired action
    * @dev IForwarder interface conformance
    * @param _evmScript Start vote with script
    */
    function forward(bytes _evmScript) public {
        require(canForward(msg.sender, _evmScript));
        /* solium-disable-next-line */
        _newVote(_evmScript, "");
    }

    /**
    * @notice Used to make sure that the permissions are being handled properl
    *         for the vote forwarding
    * @dev IForwarder interface conformance
    * @param _sender Address of the entity trying to forward
    * @return True is `_sender` has correct permissions
    */
    function canForward(address _sender, bytes _evmCallScript)
    public returns (bool)
    {
        return canPerform(_sender, CREATE_VOTES_ROLE, arr());
    }

///////////////////////
// View state functions
///////////////////////

    /**
    * @notice `canVote` is used to check whether an address is elligible to
    *         cast a vote in a given vote action.
    * @param _voter The address of the entity trying to vote
    * @param _voteId The ID of the Vote on which the vote would be cast.
    * @return True is `_voter` has a vote token balance and vote is open
    */
    function canVote(uint256 _voteId, address _voter) public view returns (bool) {
        Vote storage vote = votes[_voteId];

        return _isVoteOpen(vote) && token.balanceOfAt(_voter, vote.snapshotBlock) > 0;
    }

    /**
    * @notice `canExecute` is used to check that the participation has been met
    *         and the vote has reached it's end before the execute
    *         function is called.
    * @return True if the vote is elligible for execution.
    */
    function canExecute(uint256 /*_voteId*/) public pure returns (bool) {
        // Needs better implementation
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
        uint256 candidateSupportPct,
        uint256 totalVoters,
        string metadata,
        bytes executionScript,
        bool executed
    ) {
        Vote storage vote = votes[_voteId];

        open = _isVoteOpen(vote);
        creator = vote.creator;
        startDate = vote.startDate;
        snapshotBlock = vote.snapshotBlock;
        candidateSupportPct = vote.candidateSupportPct;
        totalVoters = vote.totalVoters;
        metadata = vote.metadata;
        executionScript = vote.executionScript;
        executed = vote.executed;
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
    *            [ specId (uint32) ] many calls with this structure ->
    *            [ to (address: 20 bytes) ]
    *            [ calldataLength (uint32: 4 bytes) ]
    *            [ calldata (calldataLength bytes) ]
    *        In order to work with a range vote the execution script must contain
    *        Arrays as its first two paramaters.
    *        The first Array is generally a list of identifiers (bytes32 or address)
    *        The second array will be composed of support value (uint256).
    * @param _metadata The metadata or vote information attached to this vote
    * @return voteId The ID(or index) of this vote in the votes array.
    */
    function _newVote(bytes _executionScript, string _metadata) internal
    isInitialized returns (uint256 voteId)
    {
        voteId = votes.length++;
        Vote storage vote = votes[voteId];
        vote.executionScript = _executionScript;
        vote.creator = msg.sender;
        vote.startDate = uint64(now);
        vote.metadata = _metadata;
        vote.snapshotBlock = getBlockNumber() - 1; // avoid double voting in this very block
        vote.totalVoters = token.totalSupplyAt(vote.snapshotBlock);
        vote.candidateSupportPct = globalCandidateSupportPct;
        vote.scriptOffset = 0;
        vote.scriptRemainder = 0;
        require(_executionScript.uint32At(0x0) == 1);
        if(_executionScript.length != 4) {
            var (scriptOffset, scriptRemainder) = _extractCandidates(_executionScript, voteId);
            vote.scriptOffset = scriptOffset;
            vote.scriptRemainder = scriptRemainder;    
        }
        StartVote(voteId);
    }

    /**
    * @dev This function needs to work with strings instead of addresses but it doesn't
    *      This fits our current use case better and string manipulation is harder
    *      since there's more like... dynamic-ness.
    */
    function _extractCandidates(bytes _executionScript, uint256 _voteId) internal returns(uint256 currentOffset, uint256 calldataLength) {
        // in order to find out the total length of our call data we take the 3rd
        // relevent byte chunk (after the specif and the target address)
        calldataLength = uint256(_executionScript.uint32At(0x4 + 0x14));
        // Since the calldataLength is 4 bytes the start offset is
        uint256 startOffset = 0x04 + 0x14 + 0x04;
        // The first paramater is located at a byte depth indicated by the first
        // word in the calldata (which is located at the startOffset + 0x04 for the function signature)
        // so we have:
        // start offset (spec id + address + calldataLength) + param offset + function signature
        uint256 firstParamOffset = startOffset + _executionScript.uint256At(startOffset + 0x04) + 0x04;
        currentOffset = firstParamOffset;

        // compute end of script / next location and ensure there's no 
        // shenanigans
        require(startOffset + calldataLength <= _executionScript.length);
        // The first word in the param slot is the length of the array
        

        uint256 candidateLength = _executionScript.uint256At(currentOffset);
    
        address currentCandidate;
        currentOffset = currentOffset + 0x20;
        // This has the potential to be too gas expensive to ever happen.
        // Upper limit of candidates should be checked against this function
        
        for(uint256 i = candidateLength; i > 0; i--){
            currentCandidate = _executionScript.addressAt(currentOffset + 0x0C);
            currentOffset = currentOffset + 0x20;
            addCandidate(_voteId, new bytes(0), currentCandidate);
            AddCandidate(currentCandidate);
        }
        // Skip the next param since it's also determined by this contract
        // In order to do this we move the offsett one word for the length of the param
        // and we move the offset one word for each param.
        currentOffset = currentOffset.add(_executionScript.uint256At(currentOffset).mul(0x20));

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
        Vote storage vote = votes[_voteId];

        // this could re-enter, though we can asume the
        // governance token is not maliciuous
        uint256 voterStake = token.balanceOfAt(_voter, vote.snapshotBlock);
        uint256 totalSupport = 0;

        uint256 voteSupport;
        uint256[] storage oldVoteSupport = vote.voters[msg.sender];
        bytes32[] storage cKeys = vote.candidateKeys;

        uint256 i = 0;
        // This is going to cost a lot of gas... it'd be cool if there was
        // a better way to do this.
        for (i; i < oldVoteSupport.length; i++) {
            totalSupport = totalSupport.add(_supports[i]);
            // Might make sense to move this outside the for loop
            // Probably safer here but some gas calculations should be done
            require(totalSupport <= voterStake);

            voteSupport = vote.candidates[cKeys[i]].voteSupport;
            voteSupport = voteSupport.sub(oldVoteSupport[i]);
            voteSupport = voteSupport.add(_supports[i]);
            vote.candidates[cKeys[i]].voteSupport = voteSupport;
        }
        for (i; i < _supports.length; i++) {
            totalSupport = totalSupport.add(_supports[i]);
            require(totalSupport <= voterStake);
            voteSupport = vote.candidates[cKeys[i]].voteSupport;
            voteSupport = voteSupport.add(_supports[i]);
            vote.candidates[cKeys[i]].voteSupport = voteSupport;
        }

        vote.voters[msg.sender] = _supports;
    }

    /**
    * @notice `_executeVote` executes the provided script for this vote and
    *         passes along the candidate data to the next function.
    * @return voteId The ID(or index) of this vote in the votes array.
    * @dev This function needs to be cleaned up ALOT; also generalized
    *      for functions that have an unknown number of params
    */
    function _executeVote(uint256 _voteId) internal {
        Vote storage vote = votes[_voteId];

        vote.executed = true;
        uint256 candidateLength = vote.candidateKeys.length;
        bytes memory executionScript = new bytes(32);
        executionScript = vote.executionScript;
        // The total length of the new script will be one 32 byte space
        // for each candidate as well as 3 32 byte spaces for
        // additional data
        uint256 scriptLength =  32 * (2 * (candidateLength + 2)) + 32 ;//+ (vote.scriptRemainder * 32);
        bytes memory script = new bytes(scriptLength);
        
        
        assembly {  
            mstore(add(script, 32), mload(add(executionScript,32)))
        }
        uint256 offset = 64;
        bytes memory smallData = new bytes(32);
        // This is the size indicator for the 
        uint256 supportsData = 2 * 32 * (candidateLength + 2) + 4;
        assembly {
            mstore(add(smallData, 32), supportsData)
        }
        for ( uint256 i = 28; i < 31; i++) {
            supportsData = uint256(smallData[i]);
            uint256 internalOffset = i + 28;
            assembly{
                mstore8(add(script,internalOffset), supportsData)
            }
        }
        // First param is located at 0x40
        supportsData = 64;

        assembly {
            mstore(add(script, offset), supportsData)
        }
        //Second param is located at 
        //0x40 + 0x20 for param 1 length + 0x20 * the number of candidates
        // May need safemath
        supportsData = 64 + ( 32 * ( 1 + candidateLength ) );
        offset += 32;

        assembly {
            mstore(add(script, offset), supportsData)
        }
        offset += 32;

        supportsData = candidateLength;

        assembly {
            mstore(add(script, offset), supportsData)
        }
        offset += 32;

        for (i = 0; i < candidateLength; i++) {
            bytes32 canKey = votes[_voteId].candidateKeys[i];
            uint256 candidateData = uint256(candidateDescriptions[canKey]);
            assembly {
                mstore(add(script, offset), candidateData)
            }
            offset += 32; 
        }


        supportsData = candidateLength;

        assembly {
            mstore(add(script, offset), supportsData)
        }
        offset += 32;        
        
        for (i = 0; i < candidateLength; i++) {
            supportsData = votes[_voteId].candidates[votes[_voteId].candidateKeys[i]].voteSupport;

            assembly {
                mstore(add(script, offset), supportsData)
            }
            offset += 32;
        }
        

        //script.copy(executionScript.getPtr(),vote.scriptOffset,vote.scriptRemainder);
        
        ExecutionScript(script, 0);
        
        runScript(script, new bytes(0), new address[](0));
        ExecuteVote(_voteId);
    }

    /**
    * @dev Calculates whether `_value` is at least a percent `_pct` over `_total`
    */
    function _isVoteOpen(Vote storage vote) internal view returns (bool) {
        return uint64(now) < (vote.startDate.add(voteTime)) && !vote.executed;
    }

    /**
    * @dev Calculates whether `_value` is at least a percent `_pct` over `_total`
    */
    function _isValuePct(uint256 _value, uint256 _total, uint256 _pct)
    internal pure returns (bool)
    {
        if (_value == 0 && _total > 0)
            return false;

        uint256 m = _total.mul(_pct);
        uint256 v = m / PCT_BASE;

        // If division is exact, allow same value,
        // otherwise require value to be greater
        return m % PCT_BASE == 0 ? _value >= v : _value > v;
    }
}
