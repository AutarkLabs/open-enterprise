pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/common/IsContract.sol";


contract RewardsCore is IsContract, AragonApp {

    event RewardAdded(uint rewardId);
    event RewardClaimed(uint rewardId);

    bytes32 public constant ADD_REWARD_ROLE =  keccak256("ADD_REWARD_ROLE");

    function initialize( Vault _vault)
    external onlyInit // solium-disable-line visibility-first
    {
        initialized();

        require(isContract(_vault), ERROR_VAULT_NOT_CONTRACT);

        vault = _vault;
    }

    function newReward(
        bool isMerit,
        address token,
        uint amount,
        uint duration,
        uint occurances,
        uint delay
    ) external payable auth(ADD_REWARD_ROLE) returns (uint rewardId) {

    }

    function claimReward(uint rewardID) external {

    }

    function getReward(uint rewardID) external view returns(
        bool isMerit,
        address token,
        uint amount,
        uint duration,
        uint occurances,
        uint delay
    )
    {

    }

}
