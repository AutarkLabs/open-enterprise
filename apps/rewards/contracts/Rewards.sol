/*
 * SPDX-License-Identitifer: GPL-3.0-or-later
 */

pragma solidity 0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/apps-shared-minime/contracts/MiniMeToken.sol";
import "@aragon/apps-vault/contracts/Vault.sol";


/**
  * @title Rewards App
  * @author Autark
  * @dev Distributes rewards in proportion to a reference asset, either as
  * one-off merit rewards or as scheduled dividend
  */
contract Rewards is AragonApp {

    /// Hardcoded constants to save gas
    /// bytes32 public constant ADD_REWARD_ROLE = keccak256("ADD_REWARD_ROLE");
    bytes32 public constant ADD_REWARD_ROLE = 0x7941efc179bdce37ebd8db3e2deb46ce5280bf6d2de2e50938a9e920494c1941;

    /// Used to limit dividends occurrences for dividend rewards
    uint8 internal constant MAX_OCCURRENCES = uint8(42);

    /// Error string constants
    string private constant ERROR_VAULT = "VAULT_NOT_A_CONTRACT";
    string private constant ERROR_REWARD_TIME_SPAN = "REWARD_CLAIMED_BEFORE_DURATION_AND_DELAY";
    string private constant ERROR_VAULT_FUNDS = "VAULT_NOT_ENOUGH_FUNDS_TO_COVER_REWARD";
    string private constant ERROR_REFERENCE_TOKEN = "REFERENCE_TOKEN_NOT_A_CONTRACT";
    string private constant ERROR_REWARD_TOKEN = "REWARD_TOKEN_NOT_ETH_OR_CONTRACT";
    string private constant ERROR_MERIT_OCCURRENCES = "MERIT_REWARD_MUST_ONLY_OCCUR_ONCE";
    string private constant ERROR_MAX_OCCURRENCES = "OCURRENCES_LIMIT_HIT";
    string private constant ERROR_START_BLOCK = "START_PERIOD_BEFORE_TOKEN_CREATION";

    /// Order optimized for storage
    struct Reward {
        MiniMeToken referenceToken;
        address creator;
        address rewardToken;
        bool isMerit;
        uint256 amount;
        uint256 duration;
        uint256 occurances;
        uint256 delay;
        uint256 value;
        uint256 blockStart;
        string description;
        mapping (address => bool) claimed;
        mapping (address => uint) timeClaimed;
    }

    /// Amount claimed for each token
    mapping (address => uint) internal totalAmountClaimed;
    uint256 public totalClaimsEach;

    /// Rewards internal registry
    Reward[] internal rewards;
    /// Public vault that holds the funds
    Vault public vault;

    /// Events
    event RewardAdded(uint256 rewardId); /// Emitted when a new reward is created
    event RewardClaimed(uint256 rewardId); /// Emitted when a reward is claimed

    /**
     * @notice Initialize Rewards app for Vault at `_vault`
     * @dev Initializes the Rewards app, this is the Aragon custom constructor
     * @param _vault Address of the vault Rewards will rely on (non changeable)
     */
    function initialize(Vault _vault) external onlyInit {
        require(isContract(_vault), ERROR_VAULT);
        vault = _vault;
        initialized();
    }

    /**
     * @notice Claim my reward for #`_rewardID`
     * @dev Allows a user to claim their reward (if one is available)
     * @param _rewardID The ID of the reward
     * @return rewardAmount calculated for that reward ID
     */
    function claimReward(uint256 _rewardID) external returns (uint256) {
        Reward storage reward = rewards[_rewardID];

        uint256 rewardTimeSpan = reward.blockStart + reward.duration + reward.delay;
        require(rewardTimeSpan < getBlockNumber(), ERROR_REWARD_TIME_SPAN);

        reward.claimed[msg.sender] = true;
        reward.timeClaimed[msg.sender] = getTimestamp();

        uint256 rewardAmount = calculateRewardAmount(reward);
        require(vault.balance(reward.rewardToken) > rewardAmount, ERROR_VAULT_FUNDS);

        if (rewardAmount > 0) {
            transferReward(reward, rewardAmount);
        }

        emit RewardClaimed(_rewardID);
        return rewardAmount;
    }

    /**
     * @notice Get total rewards count
     * @dev Gets the lenght of the rewards registry array
     * @return rewardsLength the length of the rewards array
     */
    function getRewardsLength() external view returns (uint256 rewardsLength) {
        rewardsLength = rewards.length;
    }

    /**
     * @notice Gets information for the reward with ID #`rewardID`
     * @dev Allows a user to get information about a specific reward
     * @param rewardID The ID of the reward
     * @return description message for this reward
     * @return isMerit true or false in case it is a dividend reward
     * @return referenceToken used as reference to weight the reward
     * @return rewardToken used to pay the reward
     * @return amount for this reward
     * @return startBlock when the reward went active
     * @return endBlock when the reward period ended
     * @return duration timestamp for the reward duration
     * @return delay in seconds? in case the reward start was postponed
     * @return rewardAmount which amount is available to claim?
     * @return claimed was it claimed by the msg.sender?
     * @return timeClaimed when it was claimed by the msg.sender
     * @return creator the address of the reward creator
     */
    function getReward(uint256 rewardID) external view returns (
        string description,
        bool isMerit,
        address referenceToken,
        address rewardToken,
        uint256 amount,
        uint256 startBlock,
        uint256 endBlock,
        uint256 duration,
        uint256 delay,
        uint256 rewardAmount,
        bool claimed,
        uint256 timeClaimed,
        address creator
    )
    {
        Reward storage reward = rewards[rewardID];
        description = reward.description;
        isMerit = reward.isMerit;
        referenceToken = reward.referenceToken;
        rewardToken = reward.rewardToken;
        amount = reward.amount;
        endBlock = reward.blockStart + reward.duration;
        startBlock = reward.blockStart;
        duration = reward.duration;
        delay = reward.delay;
        claimed = reward.claimed[msg.sender];
        timeClaimed = reward.timeClaimed[msg.sender];
        creator = reward.creator;
        rewardAmount = calculateRewardAmount(reward);
    }

    /**
     * @notice Get total amount of `_token` claimed
     * @dev Gets the amount of this token claimed
     * @return totalAmountClaimed for that token
     */
    function getTotalAmountClaimed(address _token)
    external view isInitialized returns (uint256)
    {
        return totalAmountClaimed[_token];
    }

    /**
     * @notice Create a new `_isMerit ? 'merit reward' : 'dividend'` of `@tokenAmount(_rewardToken, _amount)` for `_referenceToken.symbol(): string` holders (`_description`)
     * @dev This function creates a reward instance to be added to the rewards array. ID's
     *      are assigned the new intance's index of that array
     * @param _description description of the reward
     * @param _isMerit Recurring dividend reward or one-off merit reward
     * @param _referenceToken the token used to calculate reward distributions for each holder
     * @param _rewardToken currency received as reward, accepts address 0 for ETH reward
     * @param _amount the reward amount to be distributed
     * @param _startBlock block in which token transactions will begin to be tracked
     * @param _duration the time duration over which reference token earnings are calculated
     * @param _occurrences the number of occurences of a dividend reward
     * @param _delay the waiting time after the end of the period that the reward can be claimed
     * @return rewardId of the newly created Reward
     */
    function newReward(
        string _description,
        bool _isMerit,
        MiniMeToken _referenceToken,
        address _rewardToken,
        uint256 _amount,
        uint256 _startBlock,
        uint256 _duration,
        uint256 _occurrences,
        uint256 _delay
    ) public auth(ADD_REWARD_ROLE) returns (uint256 rewardId)
    {
        require(isContract(_referenceToken), ERROR_REFERENCE_TOKEN);
        require(_rewardToken == address(0) || isContract(_rewardToken), ERROR_REWARD_TOKEN);
        require(!_isMerit || _occurrences == 1, ERROR_MERIT_OCCURRENCES);
        require(_occurrences < MAX_OCCURRENCES, ERROR_MAX_OCCURRENCES);
        rewardId = rewards.length++; /// increment the rewards array to create a new one
        Reward storage reward = rewards[rewards.length - 1]; /// lenght-1 takes the last, newly created "empty" reward
        reward.description = _description;
        reward.isMerit = _isMerit;
        reward.referenceToken = _referenceToken;
        reward.rewardToken = _rewardToken;
        reward.amount = _amount;
        reward.duration = _duration;
        reward.occurances = _occurrences;
        reward.delay = _delay;
        reward.blockStart = _startBlock;
        reward.creator = msg.sender;
        emit RewardAdded(rewardId);
        if (_occurrences > 1) {
            newReward(
                _description,
                _isMerit,
                _referenceToken,
                _rewardToken,
                _amount,
                _startBlock + _duration,
                _duration,
                _occurrences - 1,
                _delay
            );
        }
        require(_startBlock > _referenceToken.creationBlock(), ERROR_START_BLOCK);
    }

    /**
     * @dev Private intermediate function that does the actual vault transfer for a reward and reward amount
     */
    function transferReward(Reward reward, uint256 rewardAmount) private {
        totalClaimsEach++;
        totalAmountClaimed[reward.rewardToken] += rewardAmount;
        vault.transfer(reward.rewardToken, msg.sender, rewardAmount);
    }

    /**
     * @dev Private intermediate function to calculate reward amount dependending of the type, balance and supply
     * @return rewardAmount calculated for that reward
     */
    function calculateRewardAmount(Reward reward) private view returns (uint256 rewardAmount) {
        uint256 balance;
        uint256 supply;
        balance = reward.referenceToken.balanceOfAt(msg.sender, reward.blockStart + reward.duration);
        supply = reward.referenceToken.totalSupplyAt(reward.blockStart + reward.duration);
        if (reward.isMerit) {
            balance -= reward.referenceToken.balanceOfAt(msg.sender, reward.blockStart);
            supply -= reward.referenceToken.totalSupplyAt(reward.blockStart);
        }
        rewardAmount = supply == 0 ? 0 : reward.amount * balance / supply;
    }
}
