pragma solidity ^0.4.24;

import "@tps/test-helpers/contracts/apps/AragonApp.sol";

// import @tps/test-helpers/contracts/Vault.sol";

// import "@tps/test-helpers/contracts/IVaultConnector.sol";

import "@tps/test-helpers/contracts/lib/zeppelin/math/SafeMath.sol";

import "@tps/test-helpers/contracts/lib/zeppelin/math/SafeMath64.sol";

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
* @title IsFundable
* @author Arthur Lunn
* @dev Basic interface to show something as fundable
*******************************************************************************/
interface Fundable {
    function fund(uint256 id) external payable;
}

/*******************************************************************************
* @title FundForwarder
* @author Arthur Lunn
* @dev This will 100% break if the contract is upgraded. Basically just a proxy
*      to receive funds from an address and "piece it out" to a layered contract
*******************************************************************************/
contract FundForwarder { // solium-disable-line blank-lines
    Fundable fundable;
    uint256 id;
    constructor(uint256 _id, address _fundable) public { // solium-disable-line blank-lines
        fundable = Fundable(_fundable);
        id = _id;
    }
    function () public payable {
        fundable.fund.value(msg.value)(id);
    }
}

/*******************************************************************************
* @title Allocations Contract
* @author Arthur Lunn
* @dev This contract is meant to handle tasks like basic budgeting,
*      and any time that tokens need to be distributed based on a certain
*      percentage breakdown to an array of addresses.
*******************************************************************************/
contract Allocations is AragonApp, Fundable { // solium-disable-line blank-lines

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
        uint256 balance;
        uint256 amount;
        uint256 startTime;
        bool distSet;
        address token;
        address proxy;
    }

    // IVaultConnector vault;


    Payout[] payouts;

    bytes32 constant public START_PAYOUT_ROLE = keccak256("START_PAYOUT_ROLE");
    bytes32 constant public SET_DISTRIBUTION_ROLE = keccak256("SET_DISTRIBUTION_ROLE");
    bytes32 constant public EXECUTE_PAYOUT_ROLE = keccak256("EXECUTE_PAYOUT_ROLE");

    event PayoutExecuted(uint256 payoutId);
    event NewAccount(uint256 accountId);
    event FundAccount(uint256 accountId);
    event SetDistribution(uint256 payoutId, uint256 amount);

    /*
    * @dev This is the function that setups who the candidates will be, and
    *      where the funds will go for the payout. This is where the payout
    *      object needs to be created in the payouts array.
    * @notice Start a payout with the specified candidates and addresses.
    *         None of the distribution or payments are handled in this step.
    *
    */
    function initialize( // solium-disable-line blank-lines
        //Vault _vault
    ) external onlyInit // solium-disable-line visibility-first
    {
        //vault = _vault.ethConnectorBase();
        initialized();
    }


    function getPayout(uint256 _payoutId) public view
    returns(uint256 balance, uint256 limit, string metadata, address token, address proxy, uint256 amount)
    {
        Payout storage payout = payouts[_payoutId];
        limit = payout.limit;
        balance = payout.balance;
        metadata = payout.metadata;
        token = payout.token;
        proxy = payout.proxy;
        amount = payout.amount;
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
    function newPayout( // solium-disable-line function-order
        string _metadata,
        uint256 _limit,
        address _token
    ) external isInitialized auth(START_PAYOUT_ROLE) returns(uint256 payoutId)
    {
        payoutId = payouts.length++;
        Payout storage payout = payouts[payoutId];
        payout.metadata = _metadata;
        payout.limit = _limit;
        payout.token = _token;
        payout.balance = 0;
        FundForwarder fund = new FundForwarder(payoutId, address(this));
        payout.proxy = address(fund);
        emit NewAccount(payoutId); // solium-disable-line emit
    }

    /**
    * @dev This is the function that the RangeVote will call. It doesn’t need
    *      to be called by a RangeVote (options get weird if it's not)
    *      but for our use case the “SET_DISTRIBUTION_ROLE” will be given to
    *      the RangeVote.
    * @notice Sets the distribution for the given `payoutId` using an the
    *         supplied candidate keys and support values.
    * param _candidateKeys The array of keys for all candidates in this payout
    * param _supports The Array of all support values for the various candidates
    */
    function setDistribution( // solium-disable-line function-order
        //bytes32[] _candidateKeys,
        address[] _candidateAddresses,
        uint256[] _supports,
        uint256 _payoutId,
        bool _informational,
        bool _recurring,
        uint256 _period,
        uint256 _amount
    ) external payable isInitialized auth(SET_DISTRIBUTION_ROLE)
    {
        Payout storage payout = payouts[_payoutId];
        //payout.candidateKeys = _candidateKeys;
        payout.candidateAddresses = _candidateAddresses;
        require(_amount <= payout.limit);  // solium-disable-line error-reason
        payout.informational = _informational;
        payout.recurring = _recurring;
        if (!_informational) {
            require(payout.balance >= _amount);
        } else {
            require(msg.value == 0);
            payout.balance = 0;
        }
        if (_recurring) {
            // minimum granularity is a single day
            payout.period = _period;
            //require(payout.period > 86399);
            payout.startTime = block.timestamp; // solium-disable-line security/no-block-members
        } else {
            payout.period = 0;
        }

        payout.distSet = true;
        /*for(uint i = 0; i < _candidateKeys.length; i++){
            require(payout.candidateKeys[i] == _candidateKeys[i]);
        }*/
        payout.supports = _supports;
        emit SetDistribution(_payoutId, _amount);
    }

    function fund(uint256 id) external payable { // solium-disable-line function-order
        Payout storage payout = payouts[id];
        require(!payout.informational); // solium-disable-line error-reason
        payout.balance = payout.balance.add(msg.value);
        //require(payout.balance <= payout.limit);
        emit FundAccount(id);
    }

    function runPayout(uint256 _payoutId) external payable isInitialized returns(bool success) { // solium-disable-line function-order
        Payout storage payout = payouts[_payoutId];
        uint256 pointsPer;
        uint256 totalSupport;
        uint i;
        for (i = 0; i < payout.supports.length; i++) {
            totalSupport += payout.supports[i];
        }

        require(!payout.informational);
        require(payout.distSet);
        if (payout.recurring) {
            // TDDO create payout execution counter to ensure payout time tracks payouts
            uint256 payoutTime = payout.startTime.add(payout.period);
            require(payoutTime < block.timestamp); // solium-disable-line security/no-block-members
            payout.startTime = payoutTime;
        } else {
            payout.distSet = false;
        }


        /*
        For now the vault isn't working see aragon-apps issue #292
        Update: Need to re-implement vault

        if (address(this).balance < payout.balance) {
            revert();
        
            uint256 remainingBalance = payout.balance.sub(this.balance);
            require(!(vault.balance(address(0)) < remainingBalance));
            vault.transfer(address(0), this, remainingBalance, new bytes(0));
        }
        */  

        pointsPer = payout.balance.div(totalSupport);
        //handle vault
        for (i = 0; i < payout.candidateAddresses.length; i++) {
            payout.candidateAddresses[i].transfer(payout.supports[i].mul(pointsPer));
        }
        success = true;
        emit PayoutExecuted(_payoutId);
    }

    function getNumberOfCandidates(uint256 _payoutId) public view returns(uint256 numCandidates) {
        Payout storage payout = payouts[_payoutId];
        numCandidates = payout.supports.length;
    }

    function getPayoutDistributionValue(uint256 _payoutId, uint256 idx) public view returns(uint256 supports) {
        Payout storage payout = payouts[_payoutId];
        supports = payout.supports[idx];
    }

    function () public payable { // solium-disable-line function-order

    }

}


