pragma solidity ^0.4.18;

import "@aragon/os/contracts/apps/AragonApp.sol";

import "@aragon/apps-vault/contracts/Vault.sol";

import "@aragon/apps-vault/contracts/IVaultConnector.sol";

import "@aragon/os/contracts/lib/zeppelin/math/SafeMath.sol";

import "@aragon/os/contracts/lib/zeppelin/math/SafeMath64.sol";

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
* @title PayoutEngine Contract
* @author Arthur Lunn
* @dev This contract is meant to handle tasks like basic budgeting,
*      and any time that tokens need to be distributed based on a certain
*      percentage breakdown to an array of addresses.
*******************************************************************************/
contract PayoutEngine is AragonApp {

    using SafeMath for uint256;

    struct Payout {
        bytes32[] candidateKeys;
        address[] candidateAddresses;
        uint256[] supports;
        string metadata;
        uint256 limit;
        bool recurring;
        bool informational;
        uint256 period;
        uint256 amount;
        uint256 startTime;
        bool distSet;
        address token;
    }

    IVaultConnector vault;


    Payout[] payouts;

    bytes32 constant public START_PAYOUT_ROLE = keccak256("START_PAYOUT_ROLE");
    bytes32 constant public SET_DISTRIBUTION_ROLE = keccak256("SET_DISTRIBUTION_ROLE");
    bytes32 constant public EXECUTE_PAYOUT_ROLE = keccak256("EXECUTE_PAYOUT_ROLE");

    /**
    * @dev This is the function that setups who the candidates will be, and
    *      where the funds will go for the payout. This is where the payout
    *      object needs to be created in the payouts array.
    * @notice Start a payout with the specified candidates and addresses.
    *         None of the distribution or payments are handled in this step.
    * @param _candidateKeys An array of all keys (descriptions) of candidates.
    * @param _candidateAddresses An array of all the recipient addresses for
    *        all candidates.
    * @param _metadata Any relevent label for the payout
    *
    */
    function initializePayout(
        Vault _vault
    ) external {
        vault = _vault.ethConnectorBase();
        initialized();
    }


    /**
    * @dev This is the function that setups who the candidates will be, and
    *      where the funds will go for the payout. This is where the payout
    *      object needs to be created in the payouts array.
    * @notice Start a payout with the specified candidates and addresses.
    *         None of the distribution or payments are handled in this step.
    * @param _metadata Any relevent label for the payout
    *
    */
    function newPayout(
        bytes32[] _candidateKeys,
        address[] _candidateAddresses,        
        string _metadata,
        uint256 _limit,
        address _token
    ) external onlyInit auth(START_PAYOUT_ROLE) returns(uint256) {
        Payout memory payout;
        payout.candidateKeys = _candidateKeys;
        payout.candidateAddresses = _candidateAddresses;
        payout.metadata = _metadata;
        payout.metadata = _metadata;
        payout.limit = _limit;
        payout.token = _token;
        payouts.push(payout);
    }



    /**
    * @dev This is the function that the RangeVote will call. It doesn’t need
    *      to be called by a RangeVote but for our use case the
    *      “SET_DISTRIBUTION_ROLE” will be given to the RangeVote.
    * @notice Sets the distribution for the given `payoutId` using an the
    *         supplied candidate keys and support values.
    * @param _candidateKeys The array of keys for all candidates in this payout
    * @param _supports The Array of all support values for the various candidates
    */
    function setDistribution(
        bytes32[] _candidateKeys,
        uint256[] _supports,
        uint256 _payoutId,
        bool _informational,
        bool _recurring,
        uint256 _period,
        uint256 _amount
    ) external onlyInit auth(SET_DISTRIBUTION_ROLE){
        Payout payout = payouts[_payoutId];
        require(_amount <= payout.limit);
        payout.informational = _informational;
        payout.recurring = _recurring;
        if(!_informational){
            payout.amount = _amount;
        } else {
            payout.amount = 0;
        }
        if(_recurring){
            // minimum granularity is a single day
            require(payout.period > 86399);
            payout.period = _period;
            payout.startTime = now;
        } else {
            payout.period = 0;
        }

        payout.distSet = true;
        for(uint i = 0; i < _candidateKeys.length; i++){
            require(payout.candidateKeys[i] == _candidateKeys[i]);
        }
        payout.supports = _supports;
    }

    /*
    * @dev This function is how a payout is used. When ether is fed into the
    *      runPayout function it’s sent out based on the distribution
    *      that’s been set. May need an additional modifier to prevent re-runs.
    * @notice When this function is called the payout will actually be
    *         processed and funds will be sent the appropriate places.
    *
    */
    function executePayout(uint256 _payoutId) external payable onlyInit auth(EXECUTE_PAYOUT_ROLE){
        Payout payout = payouts[_payoutId];
        require(!payout.informational);
        require(payout.distSet);
        if(payout.recurring){
            uint256 payoutTime = payout.startTime.add(payout.period);
            require(payoutTime > now);
            payout.startTime = payoutTime;
        } else {
            payout.distSet = false;
        }
        uint256 totalSupport;
        uint256 pointsPer;

        for(uint i = 0; i < payout.supports.length; i++){
            totalSupport += payout.supports[i];
        }

        if(this.balance < payout.amount){
            uint256 remainingBalance = payout.amount.sub(this.balance);
            require(!(vault.balance(address(0)) < remainingBalance));
            vault.transfer(address(0), this, remainingBalance, new bytes(0));
        }

        pointsPer = payout.amount.div(totalSupport);

        //handle vault

        for(i = 0; i < payout.candidateAddresses.length; i++){
            payout.candidateAddresses[i].transfer(payout.supports[i].mul(pointsPer));
        }
    }

    function () public payable {

    }

}
