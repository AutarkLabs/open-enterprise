pragma solidity 0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/apps-shared-minime/contracts/MiniMeToken.sol";
import "@aragon/apps-vault/contracts/Vault.sol";


/*******************************************************************************
* @title Rewards App Contract
* @author Arthur Lunn
* @dev This contract is meant to distribute rewards in proportion to a reference
*      asset, either as a one-off merit rewards or a scheduled dividend
*******************************************************************************/
contract Rewards is AragonApp {

    event RewardAdded(uint256 rewardId);
    event RewardClaimed(uint256 rewardId);

    bytes32 public constant ADD_REWARD_ROLE =  keccak256("ADD_REWARD_ROLE");

    struct Reward {
        bool isMerit;
        MiniMeToken referenceToken;
        address rewardToken;
        uint256 amount;
        uint256 duration;
        uint256 occurances;
        uint256 delay;
        uint256 value;
        uint256 blockStart;
        string description;
        address creator;
        mapping (address => bool) claimed;
        mapping (address => uint) timeClaimed;
    }

    mapping (address => uint) totalClaimedAmount;
    uint256 public totalClaimsEach;

    Reward[] rewards;
    Vault public vault;

    /**
    * @notice Initialize Rewards app for Vault at `_vault`
    * @dev Initializes the Rewards app
    * @param _vault Address of the vault Rewards will rely on (non changeable)
    */
    function initialize(Vault _vault) external onlyInit {
        require(isContract(_vault), "ERROR_VAULT_NOT_CONTRACT");
        vault = _vault;
        initialized();
    }

    /**
    * @dev This function allows a user to claim their reward (if one is available)
    * @notice Claim my reward for #`_rewardID`
    * @param _rewardID The ID of the reward
    */
    function claimReward(uint256 _rewardID) external returns (uint256) {
        Reward storage reward = rewards[_rewardID];
        require(
            getBlockNumber() > reward.blockStart + reward.duration + reward.delay, "reward must be claimed after the reward duration and delay"
        );
        reward.claimed[msg.sender] = true;
        reward.timeClaimed[msg.sender] = getTimestamp();
        uint256 rewardAmount = calculateRewardAmount(reward);
        require(vault.balance(reward.rewardToken) > rewardAmount, "Vault does not have enough funds to cover this reward");
        if (rewardAmount > 0) {
            transferReward(reward, rewardAmount);
        }
        emit RewardClaimed(_rewardID);
        return rewardAmount;
    }

    function getRewardsLength() external view returns (uint256 rewardsLength) {
        rewardsLength = rewards.length;
    }

    function getReward(uint256 rewardID) external view returns(
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

    function getTotalAmountClaimed(address _token)
    external view isInitialized returns (uint256 totalAmountClaimed)
    {
        totalAmountClaimed = totalClaimedAmount[_token];
    }

    /**
    * @dev This function creates a reward instance to be added to the rewards array. ID's
    *      are assigned the new intance's index of that array
    * @notice Create a new `_isMerit ? 'merit reward' : 'dividend'` of `@tokenAmount(_rewardToken, _amount)` for `_referenceToken.symbol(): string` holders (`_description`)
    * @param _description description of the reward
    * @param _isMerit Recurring dividend reward or one-off merit reward
    * @param _referenceToken the token used to calculate reward distributions for each holder
    * @param _rewardToken currency received as reward
    * @param _amount the reward amount to be distributed
    * @param _startBlock block in which token transactions will begin to be tracked
    * @param _duration the time duration over which reference token earnings are calculated
    * @param _occurances the number of occurences of a dividend reward
    * @param _delay the waiting time after the end of the period that the reward can be claimed
    */
    function newReward(
        string _description,
        bool _isMerit,
        address _referenceToken,
        address _rewardToken,
        uint256 _amount,
        uint256 _startBlock,
        uint256 _duration,
        uint256 _occurances,
        uint256 _delay
    ) public auth(ADD_REWARD_ROLE) returns (uint256 rewardId)
    {
        require(isContract(_referenceToken), "_referenceToken must be a contract");
        if (_rewardToken != address(0)) {
            require(isContract(_rewardToken), "_rewardToken must be a contract");
        }
        require(!_isMerit || _occurances == 1, "merit rewards must only occur once");
        require(_occurances < 42, "Maximum number of occurances is 41");
        require(_startBlock > MiniMeToken(_referenceToken).creationBlock(),"cannot start period prior to the creation block");
        rewardId = rewards.length++;
        Reward storage reward = rewards[rewards.length - 1];
        reward.description = _description;
        reward.isMerit = _isMerit;
        reward.referenceToken = MiniMeToken(_referenceToken);
        reward.rewardToken = _rewardToken;
        reward.amount = _amount;
        reward.duration = _duration;
        reward.occurances = _occurances;
        reward.delay = _delay;
        reward.blockStart = _startBlock;
        reward.creator = msg.sender;
        emit RewardAdded(rewardId);
        if (_occurances > 1) {
            newReward(
                _description,
                _isMerit,
                _referenceToken,
                _rewardToken,
                _amount,
                _startBlock + _duration,
                _duration,
                _occurances - 1,
                _delay
            );
        }
    function transferReward(Reward reward, uint256 rewardAmount) private {
        totalClaimsEach++;
        totalClaimedAmount[reward.rewardToken] += rewardAmount;
        vault.transfer(reward.rewardToken, msg.sender, rewardAmount);
    }

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
