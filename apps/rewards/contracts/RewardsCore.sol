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
        mapping (address => bool) claimed;
    }

    Reward[] rewards;
    Vault vault;

    function initialize( Vault _vault)
    external onlyInit // solium-disable-line visibility-first
    {
        initialized();
        require(isContract(_vault), "Vault must be a contract");
        vault = _vault;
    }

    function claimReward(uint _rewardID) external returns(uint rewardAmount) {
        Reward storage reward = rewards[_rewardID];
        require(block.number > reward.blockStart + reward.duration + reward.delay, "reward must be claimed after the reward duration and delay");
        reward.claimed[msg.sender] = true;
        // Need to implement solution to occurances
        if (reward.isMerit) {
            rewardAmount = calculateMeritReward(reward);
        } else {
            rewardAmount = calculateDividendReward(reward);
        }
        require(vault.balance(reward.rewardToken) > rewardAmount, "Vault does not have enough funds to cover this reward");
        vault.transfer(reward.rewardToken, msg.sender, rewardAmount);
    }

    function getReward(uint rewardID) external view returns(
        bool isMerit,
        address referenceToken,
        address rewardToken,
        uint amount,
        uint endBlock,
        uint delay,
        uint rewardAmount
    )
    {
        Reward storage reward = rewards[rewardID];
        isMerit = reward.isMerit;
        referenceToken = reward.referenceToken;
        rewardToken = reward.rewardToken;
        amount = reward.amount;
        endBlock = reward.blockStart + reward.duration + reward.delay;
        delay = reward.delay;
        if (reward.isMerit) {
            rewardAmount = calculateMeritReward(reward);
        } else {
            rewardAmount = calculateDividendReward(reward);
        }
    }

    function newReward(
        bool _isMerit,
        MiniMeToken _referenceToken,
        address _rewardToken,
        uint _amount,
        uint _duration,
        uint _occurances,
        uint _delay
    ) public auth(ADD_REWARD_ROLE) returns (uint rewardId)
    {
        require(isContract(_referenceToken), "_referenceToken must be a contract");
        require(isContract(_rewardToken), "_referenceToken must be a contract");
        require(!_isMerit || _occurances == 1, "merit rewards must only occur once");
        rewardId = rewards.length++;
        Reward storage reward = rewards[rewards.length - 1];
        reward.isMerit = _isMerit;
        reward.referenceToken = _referenceToken;
        reward.rewardToken = _rewardToken;
        reward.amount = _amount;
        reward.duration = _duration * _occurances;
        reward.occurances = _occurances;
        reward.delay = _delay;
        reward.blockStart = block.number;
        emit RewardAdded(rewardId);
        if (_occurances > 1) {
            newReward(_isMerit, _referenceToken, _rewardToken, _amount, _duration, _occurances - 1, _delay);
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
        uint initialBalance = reward.referenceToken.balanceOfAt(msg.sender, reward.blockStart);
        uint endingBalance = reward.referenceToken.balanceOfAt(msg.sender, reward.blockStart + reward.duration);
        require(initialSupply < endingSupply, "The supply must have increased over the period");
        require(initialBalance < endingBalance, "The user must have earned tokens over the period");
        supply = endingSupply - initialSupply;
        balance = endingBalance - initialBalance;
        rewardAmount = reward.amount * balance / supply;
    }
}
