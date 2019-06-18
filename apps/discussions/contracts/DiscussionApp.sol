pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/common/IForwarder.sol";
import "@aragon/os/contracts/lib/math/SafeMath.sol";


contract DiscussionApp is IForwarder, AragonApp {
    using SafeMath for uint256;

    event Post(address indexed author, string postCid, string discussionId, uint postId, uint createdAt);
    event Revise(address indexed author, string revisedPostCid, string discussionId, uint postId, uint createdAt, uint revisedAt);
    event Hide(address indexed author, string discussionId, uint postId, uint hiddenAt);

    bytes32 constant public DISCUSSION_POSTER_ROLE = keccak256("DISCUSSION_POSTER_ROLE");

    struct DiscussionPost {
        address author;
        string postCid;
        string discussionId;
        uint id;
        uint createdAt;
        bool show;
        string[] revisionCids;
    }

    mapping(address => DiscussionPost[]) public userPosts;

    function initialize() public onlyInit {
        initialized();
    }

    function post(string postCid, string discussionId) external auth(DISCUSSION_POSTER_ROLE) {
        DiscussionPost storage post;
        post.author = msg.sender;
        post.postCid = postCid;
        post.discussionId = discussionId;
        post.createdAt = now;
        post.show = true;
        uint postId = userPosts[msg.sender].length;
        post.id = postId;
        userPosts[msg.sender].push(post);
        emit Post(msg.sender, postCid, discussionId, postId, now);
    }

    function hide(uint postId, string discussionId) external auth(DISCUSSION_POSTER_ROLE) {
        DiscussionPost storage post = userPosts[msg.sender][postId];
        require(post.author == msg.sender, "You cannot hide a post you did not author.");
        post.show = false;
        emit Hide(msg.sender, discussionId, postId, now);
    }

    function revise(string revisedPostCid, uint postId, string discussionId) external auth(DISCUSSION_POSTER_ROLE) {
        DiscussionPost storage post = userPosts[msg.sender][postId];
        require(post.author == msg.sender, "You cannot revise a post you did not author.");
        // add the current post to the revision history
        // should we limit the number of revisions you can make to save storage?
        post.revisionCids.push(post.postCid);
        post.postCid = revisedPostCid;
        emit Revise(msg.sender, revisedPostCid, discussionId, postId, post.createdAt, now);
    }

    // Forwarding fns

    /**
    * @notice Tells whether the Voting app is a forwarder or not
    * @dev IForwarder interface conformance
    * @return Always true
    */
    function isForwarder() external pure returns (bool) {
        return true;
    }

    /**
    * @notice Creates a vote to execute the desired action, and casts a support vote if possible
    * @dev IForwarder interface conformance
    * @param _evmScript Start vote with script
    */
    function forward(bytes _evmScript) public {
        require(canForward(msg.sender, _evmScript), ERROR_CAN_NOT_FORWARD);
        // do something
    }

    /**
    * @notice Tells whether `_sender` can forward actions or not
    * @dev IForwarder interface conformance
    * @param _sender Address of the account intending to forward an action
    * @return True if the given address can create votes, false otherwise
    */
    function canForward(address _sender, bytes) public view returns (bool) {
        // Note that `canPerform()` implicitly does an initialization check itself
        return canPerform(_sender, CREATE_VOTES_ROLE, arr());
    }
}
