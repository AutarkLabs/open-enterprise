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
        MiniMeToken token;
        uint amount;
        uint duration;
        uint occurances;
        uint delay;
        uint value;
        uint blockStart;
        mapping (address => bool) claimed;
    }

    Reward[] rewards;

    function initialize( Vault _vault)
    external onlyInit // solium-disable-line visibility-first
    {
        initialized();
        require(isContract(_vault), 'Vault must be a contract');
        vault = _vault;
    }

    function newReward(
        bool _isMerit,
        MiniMeToken _token,
        uint _amount,
        uint _duration,
        uint _occurances,
        uint _delay
    ) external auth(ADD_REWARD_ROLE) returns (uint rewardId) {
        require(isContract(token), 'Token must be a contract');
        require(!_isMerit || _occuranges == 1, 'merit rewards must only occur once');
        rewardId = rewards.length++;
        Reward storage newReward = rewards[rewards.length - 1];
        newReward.isMerit = _isMerit;
        newReward.token = _token;
        newReward.amount = _amount;
        newReward.duration = _duration * _occurances;
        newReward.occurances = _occurances;
        newReward.delay = _delay;
        newReward.value = msg.value;
        newReward.blockStart = block.number;
        emit RewardAdded(rewardId);
        if(_occurances > 1) {
            newReward(_isMerit, _token, _amount, _duration, _occurances - 1, _delay);
        }
    }

    function claimReward(uint _rewardID) external returns(uint rewardAmount){
        Reward storage reward = rewards[_rewardID];
        require(block.number < reward.blockStart + reward.duration + reward.delay, 'reward must be claimed after the reward duration and delay');
        reward.claimed[msg.sender] = true;
        // Need to implement solution to occurances
        if(reward.isMerrit) {
            rewardAmount = calculateMeritReward(reward);
        } else {
            rewardAmount = calculateDividendReward(reward);
        }
        require(vault.balance > reward, 'Vault does not have enough funds to cover this reward');
        vault.transfer(reward.token, msg.sender, reward);
    }

    function getReward(uint rewardID) external view returns(
        bool isMerit,
        address token,
        uint amount,
        uint duration,
        uint delay,
        uint rewardAmount
    )
    {
        Reward storage reward = rewards[_rewardID];
        isMerit = reward.isMerit;
        token = reward.token;
        amount = reward.amouunt;
        duration = reward.duration;
        delay = reward.delay;
        if(reward.isMerrit) {
            rewardAmount = calculateMeritReward(reward);
        } else {
            rewardAmount = calculateDividendReward(reward);
        }
    }


    function calculateMeritReward(Reward reward)internal view returns(uint rewardAmount) {
        uint supply;
        uint initialSupply = reward.token.totalSupplyAt(reward.blockStart);
        uint endingSupply = reward.token.totalSupplyAt(reward.blockStart + reward.duration);
        uint intiialBalance = reward.token.balanceOfAt(reward.blockStart, msg.sender);
        uint endingBalance = reward.token.balanceOfAt(reward.blockStart + reward.duration, msg.sender);
        require(initialSupply < endingSupply, 'The supply must have increased over the period');
        require(initialBalance < endingBalance, 'The user must have earned tokens over the period');

        supply = endingSupply - initialSupply;
        rewardAmount = reward.value * (endingBalance - initialBalance) / supply;
    }

    function calculateDividendReward(Reward reward) internal view returns(uint reward) {
        uint balance;
        uint supply;
        balance = reward.token.totalSupplyAt(reward.blockStart + reward.duration);
        supply = reward.token.totalSupplyAt(reward.blockStart + reward.duration);
        rewardAmount = reward.value * balance / supply;
    }

}
