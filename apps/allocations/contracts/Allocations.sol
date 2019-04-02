pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";

import "@tps/apps-address-book/contracts/AddressBook.sol";

import "@aragon/os/contracts/lib/math/SafeMath.sol";

import "@aragon/os/contracts/lib/math/SafeMath64.sol";

/*******************************************************************************
    Copyright 2018, That Planning Suite
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
*      Any advice on best practice for this would be welcome.
*******************************************************************************/
contract FundForwarder {
    Fundable fundable;
    uint256 id;

    constructor(uint256 _id, Fundable _fundable) public {
        fundable = _fundable;
        id = _id;
    }

    function () external payable {
        fundable.fund.value(msg.value)(id);
    }
}


/*******************************************************************************
* @title Allocations Contract
* @author Arthur Lunn
* @dev This contract is meant to handle tasks like basic budgeting,
*      and any time that tokens need to be distributed based on a certain
*      percentage breakdown to an array of addresses. Currently it works with ETH
*      needs to be adapted to work with tokens.
*******************************************************************************/
contract Allocations is AragonApp, Fundable {

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


    AddressBook public addressBook;
    Payout[] payouts;

    bytes32 constant public START_PAYOUT_ROLE = keccak256("START_PAYOUT_ROLE");
    bytes32 constant public SET_DISTRIBUTION_ROLE = keccak256("SET_DISTRIBUTION_ROLE");
    bytes32 constant public EXECUTE_PAYOUT_ROLE = keccak256("EXECUTE_PAYOUT_ROLE");

    event PayoutExecuted(uint256 accountId);
    event NewAccount(uint256 accountId);
    event FundAccount(uint256 accountId);
    event SetDistribution(uint256 accountId);

    /*
    * @dev This is the function that setups who the candidates will be, and
    *      where the funds will go for the payout. This is where the payout
    *      object needs to be created in the payouts array.
    * @notice Start a payout with the specified candidates and addresses.
    *         None of the distribution or payments are handled in this step.
    */
    function initialize(
        AddressBook _addressBook
    ) external onlyInit
    {
        addressBook = _addressBook;
        initialized();
    }

///////////////////////
// Getter functions
///////////////////////
    function getPayout(uint256 _payoutId) external view
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

    function getNumberOfCandidates(uint256 _payoutId) external view returns(uint256 numCandidates) {
        Payout storage payout = payouts[_payoutId];
        numCandidates = payout.supports.length;
    }

    function getPayoutDistributionValue(uint256 _payoutId, uint256 idx) external view returns(uint256 supports) {
        Payout storage payout = payouts[_payoutId];
        supports = payout.supports[idx];
    }

///////////////////////
// Payout functions
///////////////////////
    /**
    * @dev This is the function that sets up who the candidates will be, and
    *      where the funds will go for the payout. This is where the payout
    *      object needs to be created in the payouts array.
    * @notice Create allocation account `_metadata`
    * @param _metadata Any relevent label for the payout
    *
    */
    function newPayout(
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
        FundForwarder fund = new FundForwarder(payoutId, this);
        payout.proxy = address(fund);
        emit NewAccount(payoutId);
    }

    function fund(uint256 id) external payable {
        Payout storage payout = payouts[id];
        require(!payout.informational);
        payout.balance = payout.balance.add(msg.value);
        emit FundAccount(id);
    }

    /**
    * @dev This function distributes the payouts to the candidates in accordance with the distribution values
    * @notice Send payout amounts to the candidates in accordance with the distribution proportions
    * @param _payoutId Any relevent label for the payout
    */
    function runPayout(uint256 _payoutId) external payable isInitialized auth(EXECUTE_PAYOUT_ROLE) returns(bool success) {
        Payout storage payout = payouts[_payoutId];
        uint256 totalSupport;
        uint i;
        for (i = 0; i < payout.supports.length; i++) {
            totalSupport += payout.supports[i];
        }
        require(!payout.informational, "Informational payouts don't run");
        require(payout.distSet, "setDistribution must be called first");
        if (payout.recurring) {
            // TODO create payout execution counter to ensure payout time tracks payouts
            uint256 payoutTime = payout.startTime.add(payout.period);
            require(payoutTime < block.timestamp,"payout period not yet finished"); // solium-disable-line security/no-block-members
            payout.startTime = payoutTime;
        } else {
            payout.distSet = false;
        }

        uint individualPayout;
        //handle vault
        for (i = 0; i < payout.candidateAddresses.length; i++) {
            individualPayout = payout.supports[i].mul(payout.amount).div(totalSupport);
            payout.candidateAddresses[i].transfer(individualPayout);
            payout.balance = payout.balance.sub(individualPayout);
        }
        success = true;
        emit PayoutExecuted(_payoutId);
    }

    /**
    * @dev This is the function that the RangeVote will call. It doesn’t need
    *      to be called by a RangeVote (options get weird if it's not)
    *      but for our use case the “SET_DISTRIBUTION_ROLE” will be given to
    *      the RangeVote.
    * @notice Create an `_amount` allocation range vote for `_description`
    * @param _candidateAddresses Array of candidates to be allocated a portion of the payouut
    * @param _supports The Array of all support values for the various candidates. These values are set in range voting
    * @param _payoutId The Account used for the payout
    * @param _informational boolean used to indicate whether and funds will be trnsacted onchain
    * @param _recurring boolean used to indicate whether this is a recurring or one-time payout
    * @param _period time interval between each recurring payout
    * @param _amount The quantity of funds to be allocated
    * @param _description The distributions description
    */
    function setDistribution(
        address[] _candidateAddresses,
        uint256[] _supports,
        uint256[] /*unused_infoIndices*/,
        string /*unused_candidateInfo*/,
        string _description,
        uint256[] /*unused_level 1 ID - converted to bytes32*/,
        uint256[] /*unused_level 2 ID - converted to bytes32*/,
        uint256 _payoutId,
        bool _informational,
        bool _recurring,
        uint256 _period,
        uint256 _amount
    ) public payable isInitialized auth(SET_DISTRIBUTION_ROLE)
    {
        Payout storage payout = payouts[_payoutId];
        payout.candidateAddresses = _candidateAddresses;
        // require(_amount <= payout.limit, "payout amount over account limit"); // This is unnecessary
        payout.informational = _informational;
        payout.recurring = _recurring;
        if (!_informational) {
            payout.balance.add(msg.value);
            payout.amount = _amount;
            require(payout.balance >= _amount, "payout account underfunded");
            require(payout.limit >= _amount, "payout amount over account limit");
        } else {
            require(msg.value == 0, "cannot fund informational allocation");
            // must set amount to zero
            //setting balance to zero orphans the funds submitted to this account
            payout.amount = 0;
        }
        if (_recurring) {
            payout.period = _period;
            // minimum granularity is a single day
            // This check is disabled currently to enable testing of shorter times
            //require(payout.period > 86399);
            payout.startTime = block.timestamp; // solium-disable-line security/no-block-members
        } else {
            payout.period = 0;
        }

        payout.distSet = true;
        payout.supports = _supports;
        emit SetDistribution(_payoutId);
    }

}
