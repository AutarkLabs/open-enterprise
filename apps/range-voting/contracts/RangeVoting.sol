pragma solidity ^0.4.18;

import "@aragon/os/contracts/apps/AragonApp.sol";

import "@aragon/os/contracts/lib/minime/MiniMeToken.sol";

import "@aragon/os/contracts/lib/zeppelin/math/SafeMath.sol";

import "@aragon/os/contracts/lib/zeppelin/math/SafeMath64.sol";

import "@aragon/os/contracts/common/IForwarder.sol";


contract RangeVoting is IForwarder, AragonApp {
    
    using SafeMath for uint256;
    using SafeMath64 for uint64;

    MiniMeToken public token;
    uint256 public candidateSupportPct;
    uint256 public minParticipationPct;
    uint64 public voteTime;

    uint256 constant public PCT_BASE = 10 ** 18;

    bytes32 constant public CREATE_VOTES_ROLE = keccak256("CREATE_VOTES_ROLE");
    bytes32 constant public ADD_CANDIDATES_ROLE = keccak256("ADD_CANDIDATES_ROLE");
    bytes32 constant public MODIFY_PARTICIPATION_ROLE = keccak256("MODIFY_PARTICIPATION_ROLE");

    struct Vote {
        address creator;
        uint64 startDate;
        uint256 snapshotBlock;
        uint256 candidateSupportPct;
        uint256 totalVoters;
        string metadata;
        bytes executionScript;
        bool executed;
        string[] candidateKeys;
        mapping (bytes32 => CandidateState) candidates;
        mapping (address => uint256[]) voters;
    }

    struct CandidateState {
        bool added;
        bytes metadata;
        uint8 keyArrayIndex;
        uint256 voteSupport;
    }

    Vote[] votes;

    event StartVote(uint256 indexed voteId);
    event CastVote(uint256 indexed voteId, address indexed voter, uint256[] supports, uint256 stake);
    event UpdateCandidateSupport(string indexed candidateKey, uint256 support);
    event ExecuteVote(uint256 indexed voteId);
    event ChangeCandidateSupport(uint256 candidateSupportPct);

    /**
    * @notice Initializes Voting app with `_token.symbol(): string` for governance, minimum participation of `(_minParticipationPct - _minParticipationPct % 10^14) / 10^16`, minimal candidate acceptance of `(_candidateSupportPct - _candidateSupportPct % 10^14) / 10^16` and vote duations of `(_voteTime - _voteTime % 86400) / 86400` day `_voteTime >= 172800 ? 's' : ''`
    * @param _token MiniMeToken address that will be used as governance token
    * @param _minParticipationPct Percentage of voters that must participate in a vote for it to succeed (expressed as a 10^18 percentage, (eg 10^16 = 1%, 10^18 = 100%)
    * @param _candidateSupportPct Percentage of cast voting power that must support a candidate for it to be counted (expressed as a 10^18 percentage, (eg 10^16 = 1%, 10^18 = 100%)
    * @param _voteTime Seconds that a vote will be open for token holders to vote (unless it is impossible for the fate of the vote to change)
    */
    function initialize(
        MiniMeToken _token,
        uint256 _minParticipationPct,
        uint256 _candidateSupportPct,
        uint64 _voteTime
    ) onlyInit external
    {
        initialized();

        require(_minParticipationPct > 0);
        require(_minParticipationPct <= PCT_BASE);
        require(_minParticipationPct >= _candidateSupportPct);

        token = _token;
        minParticipationPct = _minParticipationPct;
        candidateSupportPct = _candidateSupportPct;
        voteTime = _voteTime;

        votes.length += 1;
    }

    /**
    * @notice Create a new vote about "`_metadata`"
    * @param _executionScript EVM script to be executed on approval
    * @return voteId id for newly created vote
    */
    function newVote(bytes _executionScript, string _metadata) auth(CREATE_VOTES_ROLE) external returns (uint256 voteId) {
        return _newVote(_executionScript, _metadata);
    }

    function vote(uint256 _voteId, uint256[] _supports, bool _executesIfDecided) external {
        //needs implementation
    }

    function addCandidate(bytes metadata, string description) external auth(ADD_CANDIDATES_ROLE) {
        // needs implementation
    }
    
    function getCandidate(string description) external {
        // Needs implementation (should return)        
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

    function isForwarder() public pure returns (bool) {
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

    function canForward(address _sender, bytes _evmCallScript) public view returns (bool) {
        return canPerform(_sender, CREATE_VOTES_ROLE, arr());
    }
    
    function canVote(uint256 _voteId, address _voter) public view returns (bool) {
        Vote storage vote = votes[_voteId];

        return _isVoteOpen(vote) && token.balanceOfAt(_voter, vote.snapshotBlock) > 0;
    }

    function canExecute(uint256 _voteId) public view returns (bool) {
        // Needs implementation
    }

    function getVote(uint256 _voteId) public view {
        // Needs implementation (should return)
    }

    function getVoteMetadata(uint256 _voteId) public view returns (string) {
        return votes[_voteId].metadata;
    }

    function getVoterState(uint256 _voteId, address _voter) public view {
        // Needs implementation (should return)
    }

    function _newVote(bytes _executionScript, string _metadata) isInitialized internal returns (uint256 voteId) {
        // Needs implementation (should be very similar to standard vote)
    }
    
    function _vote(
        uint256 _voteId,
        uint256[] _supports,
        address _voter,
        bool _executesIfDecided
    ) internal
    {
        // Needs implementation        
    }

    function _executeVote(uint256 _voteId) internal {
        // Needs implementation
    }

    function _isVoteOpen(Vote storage vote) internal view returns (bool) {
        return uint64(now) < (vote.startDate.add(voteTime)) && !vote.executed;
    }

    /**
    * @dev Calculates whether `_value` is at least a percent `_pct` over `_total`
    */
    function _isValuePct(uint256 _value, uint256 _total, uint256 _pct) internal pure returns (bool) {
        if (_value == 0 && _total > 0)
            return false;

        uint256 m = _total.mul(_pct);
        uint256 v = m / PCT_BASE;

        // If division is exact, allow same value, otherwise require value to be greater
        return m % PCT_BASE == 0 ? _value >= v : _value > v;
    }
}
