/*
 * SPDX-License-Identitifer: GPL-3.0-or-later
 */

pragma solidity 0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/apps-shared-minime/contracts/MiniMeToken.sol";

// TODO: Revert import path when changes get merged into aragon/os
// import "@aragon/os/contracts/common/ADynamicForwarder.sol";
import "@tps/test-helpers/contracts/common/ADynamicForwarder.sol";


/**
  * @title DotVoting App
  * @author Autark
* @dev This vote is meant to take a set of options and then let
  * holders of a specific token distribute their current voting
  * weight along all options. The code is designed to work as an
  * Aragon app [much thanks to the team for much of the codes structure]
  * but could easily be adapted to other systems.
  * Attention was paid to make the program as generalized as possible.
  */
contract DotVoting is ADynamicForwarder, AragonApp {

    MiniMeToken public token;
    uint256 public globalCandidateSupportPct;
    uint256 public globalMinQuorum;
    uint64 public voteTime;
    uint256 voteLength;

    uint256 constant public PCT_BASE = 10 ** 18; // 0% = 0; 1% = 10^16; 100% = 10^18

    bytes32 constant public CREATE_VOTES_ROLE = keccak256("CREATE_VOTES_ROLE");
    bytes32 constant public MODIFY_QUORUM = keccak256("MODIFY_QUORUM");
    bytes32 constant public MODIFY_CANDIDATE_SUPPORT = keccak256("MODIFY_CANDIDATE_SUPPORT");
    bytes32 constant public ADD_CANDIDATES_ROLE = keccak256("ADD_CANDIDATES_ROLE");

    struct Vote {
        string metadata;
        address creator;
        uint64 startDate;
        uint256 snapshotBlock;
        uint256 candidateSupportPct;
        uint256 minQuorum;
        uint256 totalVoters;
        uint256 totalParticipation;
        mapping (address => uint256[]) voters;
        uint256 actionId;
    }

    mapping (uint256 => Vote) votes;

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
    event UpdateQuorum(uint256 quorum);
    event UpdateMinimumSupport(uint256 minSupport);

////////////////
// Constructor
////////////////

   /**
    * @notice Initializes DotVoting app with `_token.symbol(): string` for
    *         governance, minimum quorum of
    *         `(_minQuorum - _minQuorum % 10^14)
    *         / 10^16`, minimal candidate acceptance of
    *         `(_candidateSupportPct - _candidateSupportPct % 10^14) / 10^16`
    *         and vote duations of `(_voteTime - _voteTime % 86400) / 86400`
    *         day `_voteTime >= 172800 ? 's' : ''`
    * @param _token MiniMeToken address that will be used as governance token
    * @param _minQuorum Percentage of voters that must participate in
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
        uint256 _minQuorum,
        uint256 _candidateSupportPct,
        uint64 _voteTime
    ) external onlyInit
    {
        initialized();
        require(_minQuorum > 0); // solium-disable-line error-reason
        require(_minQuorum <= PCT_BASE); // solium-disable-line error-reason
        require(_minQuorum >= _candidateSupportPct); // solium-disable-line error-reason
        token = _token;
        globalMinQuorum = _minQuorum;
        globalCandidateSupportPct = _candidateSupportPct;
        voteTime = _voteTime;
        voteLength = 1;
    }

///////////////////////
// Voting functions
///////////////////////


    /**
    * @notice Create a new dot vote about "`_metadata`"
    * @param _executionScript EVM script to be executed on approval
    * @param _metadata Vote metadata
    * @return voteId Id for newly created vote
    */
    function newVote(bytes _executionScript, string _metadata)
        external auth(CREATE_VOTES_ROLE) returns (uint256 voteId)
    {
        voteId = _newVote(_executionScript, _metadata); /*, true);*/
    }

    /**
    * @notice Cast a dot vote.
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
    * @notice Execute dot vote `_voteId`
    * @param _voteId Id for vote
    */
    function executeVote(uint256 _voteId) external {
        require(canExecute(_voteId), "vote not meeting execution requirements");
        _executeVote(_voteId);
    }

    /**
    * @notice `getCandidate` serves as a basic getter using the description
    *         to return the struct data.
    * @param _voteId id for vote structure this 'ballot action' is connected to
    * @param _candidateIndex The candidate descrciption of the candidate.
    */
    function getCandidate(uint256 _voteId, uint256 _candidateIndex)
    external view returns(address candidateAddress, uint256 voteSupport, string metadata, bytes32 externalId1, bytes32 externalId2)
    {
        uint256 actionId = votes[_voteId].actionId;
        Action storage action = actions[actionId];
        OptionState storage candidate = action.options[action.optionKeys[_candidateIndex]];
        candidateAddress = optionAddresses[action.optionKeys[_candidateIndex]];
        voteSupport = candidate.actionSupport;
        metadata = candidate.metadata;
        externalId1 = candidate.externalId1;
        externalId2 = candidate.externalId2;
    }

    /**
    * @notice `setglobalCandidateSupportPct` serves as a basic getter using the description
    *         to return the struct data.
    * @param _globalCandidateSupportPct Percentage of cast voting power that must
    *        support a candidate for it to be counted (expressed as a 10^18
    *        percentage, (eg 10^16 = 1%, 10^18 = 100%)
    */
    function setglobalCandidateSupportPct(uint256 _globalCandidateSupportPct)
    external auth(MODIFY_CANDIDATE_SUPPORT)
    {
        require(globalMinQuorum >= _globalCandidateSupportPct); // solium-disable-line error-reason
        globalCandidateSupportPct = _globalCandidateSupportPct;
        emit UpdateMinimumSupport(globalCandidateSupportPct);
    }

    /**
    * @notice `setGlobalQuorum` serves as a basic setter for the qourum.
    * @param _minQuorum Percentage of voters that must participate in
    *        a vote for it to succeed (expressed as a 10^18 percentage,
    *        (eg 10^16 = 1%, 10^18 = 100%)
    */
    function setGlobalQuorum(uint256 _minQuorum)
    external auth(MODIFY_QUORUM)
    {
        require(_minQuorum > 0); // solium-disable-line error-reason
        require(_minQuorum <= PCT_BASE); // solium-disable-line error-reason
        require(_minQuorum >= globalCandidateSupportPct); // solium-disable-line error-reason
        globalMinQuorum = _minQuorum;
        emit UpdateQuorum(globalMinQuorum);
    }

    /**
    * @notice `addCandidate` allows the `ADD_CANDIDATES_ROLE` to add candidates
    *         (or options) to the current dot vote.
    * @param _voteId id for vote structure this 'ballot action' is connected to
    * @param _metadata Any additional information about the candidate.
    *        Base implementation does not use this parameter.
    * @param _description This is the string that will be displayed along the
    *        option when voting
    * @param _eId1 External ID 1, can be used for basic candidate information
    * @param _eId2 External ID 2, can be used for basic candidate information
    */
    function addCandidate(uint256 _voteId, string _metadata, address _description, bytes32 _eId1, bytes32 _eId2)
    public auth(ADD_CANDIDATES_ROLE)
    {
        require(_voteId < voteLength);
        addOption(votes[_voteId].actionId, _metadata, _description, _eId1, _eId2);
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
    *         for the dot vote forwarding
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
    *         cast a dot vote in a given dot vote action.
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
        Action storage action = actions[voteInstance.actionId];
        if (action.executed)
            return false;
         // vote ended?
        if (_isVoteOpen(voteInstance))
          return false;
         // has minimum participation threshold been reached?
        if (!_isValuePct(voteInstance.totalParticipation, voteInstance.totalVoters, voteInstance.minQuorum))
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
        Action memory action = actions[voteInstance.actionId];
        open = _isVoteOpen(voteInstance);
        creator = voteInstance.creator;
        startDate = voteInstance.startDate;
        snapshotBlock = voteInstance.snapshotBlock;
        candidateSupport = voteInstance.candidateSupportPct;
        totalVoters = voteInstance.totalVoters;
        totalParticipation = voteInstance.totalParticipation;
        executionScript = action.executionScript;
        executed = action.executed;
        externalId = action.externalId;
        voteDescription = action.description;
    }

        /**
    * @notice `getCandidateLength` returns the total number of candidates for
    *         a given vote.
    * @param _voteId The ID of the Vote struct in the `votes` array
    */
    function getCandidateLength(uint256 _voteId) public view returns
    ( uint totalCandidates ) { // solium-disable-line lbrace
        uint256 actionId = votes[_voteId].actionId;
        totalCandidates = actions[actionId].optionKeys.length;
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
    *        In order to work with a dot vote the execution script must contain
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
        require(_executionScript.uint32At(0x0) == 1); // solium-disable-line error-reason
        uint256 actionId = parseScript(_executionScript);
        voteId = voteLength++;
        Vote storage voteInstance = votes[voteId];
        voteInstance.creator = msg.sender;
        voteInstance.metadata = _metadata;
        voteInstance.actionId = actionId;
        voteInstance.startDate = uint64(block.timestamp); // solium-disable-line security/no-block-members
        voteInstance.snapshotBlock = getBlockNumber() - 1; // avoid double voting in this very block
        voteInstance.totalVoters = token.totalSupplyAt(voteInstance.snapshotBlock);
        voteInstance.candidateSupportPct = globalCandidateSupportPct;
        voteInstance.minQuorum = globalMinQuorum;
        // First Static Parameter in script parsed for the externalId
        emit ExternalContract(voteId, _executionScript.addressAt(0x4),_executionScript.bytes32At(0x0));
        emit StartVote(voteId);
        emit ExecutionScript(_executionScript, 0);
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
        Action storage action = actions[voteInstance.actionId];

        // this could re-enter, though we can asume the
        // governance token is not maliciuous
        uint256 voterStake = token.balanceOfAt(_voter, voteInstance.snapshotBlock);
        uint256 totalSupport = 0;

        emit CastVote(_voteId);


        uint256 voteSupport;
        uint256[] storage oldVoteSupport = voteInstance.voters[msg.sender];
        bytes32[] storage cKeys = action.optionKeys;

        uint256 i = 0;
        // This is going to cost a lot of gas... it'd be cool if there was
        // a better way to do this.
        for (i; i < oldVoteSupport.length; i++) {
            totalSupport = totalSupport.add(_supports[i]);
            // Might make sense to move this outside the for loop
            // Probably safer here but some gas calculations should be done
            require(totalSupport <= voterStake); // solium-disable-line error-reason
            voteSupport = action.options[cKeys[i]].actionSupport;
            voteInstance.totalParticipation = voteInstance.totalParticipation.sub(oldVoteSupport[i]);
            voteSupport = voteSupport.sub(oldVoteSupport[i]);
            voteSupport = voteSupport.add(_supports[i]);
            voteInstance.totalParticipation = voteInstance.totalParticipation.add(_supports[i]);
            action.options[cKeys[i]].actionSupport = voteSupport;
        }
        for (i; i < _supports.length; i++) {
            totalSupport = totalSupport.add(_supports[i]);
            require(totalSupport <= voterStake); // solium-disable-line error-reason
            voteSupport = action.options[cKeys[i]].actionSupport;
            voteSupport = voteSupport.add(_supports[i]);
            voteInstance.totalParticipation = voteInstance.totalParticipation.add(_supports[i]);
            action.options[cKeys[i]].actionSupport = voteSupport;
        }

        voteInstance.voters[msg.sender] = _supports;
    }

    /**
    * @notice `_pruneVotes` trims out options that don't meet the minimum support pct.
    */
    function _pruneVotes(uint256 _voteId, uint256 _candidateSupportPct) internal {
        Vote storage voteInstance = votes[_voteId];
        uint256 actionId = voteInstance.actionId;
        Action storage action = actions[actionId];
        bytes32[] memory candidateKeys = actions[actionId].optionKeys;
        uint256 candidateLength = candidateKeys.length;
        for (uint256 i = 0; i < candidateLength; i++) {
            bytes32 key = candidateKeys[i];
            OptionState storage candidateState = action.options[key];
            if (!_isValuePct(candidateState.actionSupport, voteInstance.totalParticipation, voteInstance.candidateSupportPct)) {
                voteInstance.totalParticipation -= candidateState.actionSupport;
                candidateState.actionSupport = 0;
            }
        }
    }

    /**
    * @notice `_executeVote` executes the provided script for this vote and
    *         passes along the candidate data to the next function.
    * @return voteId The ID(or index) of this vote in the votes array.
    */
    function _executeVote(uint256 _voteId) internal {
        Vote storage voteInstance = votes[_voteId];
        uint256 actionId = voteInstance.actionId;
        Action storage action = actions[actionId];
        uint256 candidateSupportPct = voteInstance.candidateSupportPct;
        if (candidateSupportPct > 0) {
            _pruneVotes(_voteId, candidateSupportPct);
        }
        bytes memory script = encodeInput(voteInstance.actionId);
        emit ExecutionScript(script, 0);
        action.executed = true;
        runScript(script, new bytes(0), new address[](0));
        emit ExecuteVote(_voteId);
    }

    /**
    * @dev Calculates whether `_value` is at least a percent `_pct` over `_total`
    */
    function _isVoteOpen(Vote storage voteArg) internal view returns (bool) {
        Action memory action = actions[voteArg.actionId];
        return uint64(block.timestamp) < (voteArg.startDate.add(voteTime)) && !action.executed; // solium-disable-line security/no-block-members
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
