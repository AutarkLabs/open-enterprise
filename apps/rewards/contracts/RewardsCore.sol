pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/common/IsContract.sol";
import "@tps/test-helpers/contracts/lib/misc/Migrations.sol";
import "@aragon/apps-shared-minime/contracts/MiniMeToken.sol";
import "@aragon/apps-vault/contracts/Vault.sol";


contract RewardsCore is IsContract, AragonApp {

    event RewardAdded(uint rewardId);
    event RewardClaimed(uint rewardId);

    bytes32 public constant ADD_REWARD_ROLE =  keccak256("ADD_REWARD_ROLE");

    struct Reward {
        bool isMerit;
        MiniMeToken referenceToken;
        address rewardToken;
        uint amount;
        uint duration;
        uint occurances;
        uint delay;
        uint value;
        uint blockStart;
        string description;
        address creator;
        mapping (address => bool) claimed;
        mapping (address => uint) timeClaimed;
    }

    Reward[] rewards;
    Vault public vault;

    function initialize( Vault _vault)
    external onlyInit
    {
        initialized();
        require(isContract(_vault), "Vault must be a contract");
        vault = _vault;
    }

    function claimReward(uint _rewardID) external returns(uint rewardAmount) {
        Reward storage reward = rewards[_rewardID];
        require(block.number > reward.blockStart + reward.duration + reward.delay, "reward must be claimed after the reward duration and delay");
        reward.claimed[msg.sender] = true;
        reward.timeClaimed[msg.sender] = block.timestamp; // solium-disable-line security/no-block-members
        // Need to implement solution to occurances
        if (reward.isMerit) {
            rewardAmount = calculateMeritReward(reward);
        } else {
            rewardAmount = calculateDividendReward(reward);
        }
        if (rewardAmount == 0) {
            return 0;
        }
        require(vault.balance(reward.rewardToken) > rewardAmount, "Vault does not have enough funds to cover this reward");
        vault.transfer(reward.rewardToken, msg.sender, rewardAmount);
        emit RewardClaimed(_rewardID);
    }

    function getReward(uint rewardID) external view returns(
        string description,
        bool isMerit,
        address referenceToken,
        address rewardToken,
        uint amount,
        uint startBlock,
        uint endBlock,
        uint duration,
        uint delay,
        uint rewardAmount,
        bool claimed,
        uint timeClaimed,
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
        if (reward.isMerit) {
            rewardAmount = calculateMeritReward(reward);
        } else {
            rewardAmount = calculateDividendReward(reward);
        }
        //rewardAmount = 50;
    }

    /**
    * @dev This function creates a reward instance to be added to the rewards array. ID's
    *      are assigned the new intance's index of that array
    * @notice Create a new reward
    * @param _isMerit Recurring dividend reward one-off merit reward
    * @param _referenceToken the token used to calculate reward distributions for each holder
    * @param _rewardToken currency received as reward
    * @param _amount the reward amount to be distributed
    * @param _duration the time duration over which reference token earnings are calculated
    * @param _occurances the number of occurences of a dividend reward
    * @param _delay the waiting time after the end of the period that the reward can be claimed
    * @return the reward Id
    */
    function newReward(
        string _description,
        bool _isMerit,
        address _referenceToken,
        address _rewardToken,
        uint _amount,
        uint _startBlock,
        uint _duration,
        uint _occurances,
        uint _delay
    ) public auth(ADD_REWARD_ROLE) returns (uint rewardId)
    {
        require(isContract(_referenceToken), "_referenceToken must be a contract");
        if (_rewardToken != address(0)) {
            require(isContract(_rewardToken), "_referenceToken must be a contract");
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
    }

    function calculateDividendReward(Reward reward) internal view returns(uint rewardAmount) {
        uint balance;
        uint supply;
        balance = reward.referenceToken.balanceOfAt(msg.sender, reward.blockStart + reward.duration);
        supply = reward.referenceToken.totalSupplyAt(reward.blockStart + reward.duration);
        rewardAmount = reward.amount * balance / supply;
    }

    function calculateMeritReward(Reward reward)internal view returns(uint rewardAmount) {
        uint supply;
        uint balance;
        uint initialSupply = reward.referenceToken.totalSupplyAt(reward.blockStart);
        uint endingSupply = reward.referenceToken.totalSupplyAt(reward.blockStart + reward.duration);
        supply = endingSupply - initialSupply;
        if (supply == 0) {
            return 0;
        }

        uint initialBalance = reward.referenceToken.balanceOfAt(msg.sender, reward.blockStart);
        uint endingBalance = reward.referenceToken.balanceOfAt(msg.sender, reward.blockStart + reward.duration);
        //require(initialSupply < endingSupply, "The supply must have increased over the period");
        //require(initialBalance < endingBalance, "The user must have earned tokens over the period");

        balance = endingBalance - initialBalance;
        rewardAmount = reward.amount * balance / supply;
    }
}
