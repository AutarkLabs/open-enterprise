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
        //uint256 limit;
        bool recurring;
        //bool informational;
        uint256 period;
        //uint256 balance;
        uint256 amount;
        uint256 startTime;
        bool distSet;
        //address token;
        //address proxy;
    }

    struct Account {
        Payout[] payouts;
        string metadata;
        uint limit;
        uint balance;
        address token;
        address proxy;
    }


    AddressBook public addressBook;
    Account[] accounts;
    Payout[] payouts;
    mapping(address => uint) accountProxies; // proxy address -> account Id

    bytes32 constant public START_PAYOUT_ROLE = keccak256("START_PAYOUT_ROLE");
    bytes32 constant public SET_DISTRIBUTION_ROLE = keccak256("SET_DISTRIBUTION_ROLE");
    bytes32 constant public EXECUTE_PAYOUT_ROLE = keccak256("EXECUTE_PAYOUT_ROLE");

    event PayoutExecuted(uint256 accountId, uint payoutId);
    event NewAccount(uint256 accountId);
    event FundAccount(uint256 accountId);
    event SetDistribution(uint256 accountId, uint payoutId);

    /**
    * @dev This is the function that sets up who the candidates will be, and
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
        accounts.length++;  // position 0 is reserved and unused
        initialized();
    }

///////////////////////
// Getter functions
///////////////////////
    function getAccount(uint256 _accountId) external view
    returns(uint256 balance, uint256 limit, string metadata, address token, address proxy, uint256 amount)
    {
        Account storage account = accounts[_accountId];
        limit = account.limit;
        balance = account.balance;
        metadata = account.metadata;
        token = account.token;
        proxy = account.proxy;
    }

    function getNumberOfCandidates(uint _accountId, uint _payoutId) external view returns(uint256 numCandidates) {
        Payout storage payout = payouts[_payoutId];
        numCandidates = payout.supports.length;
    }

    function getPayoutDistributionValue(uint _accountId, uint256 _payoutId, uint256 idx) external view returns(uint256 supports) {
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
    * @notice Create a new account used for creating allocations
    * @param _metadata Any relevent label for the payout
    *
    */
    function newAccount(
        string _metadata,
        uint256 _limit,
        address _token
    ) external auth(START_PAYOUT_ROLE) returns(uint256 accountId)
    {
        accountId = accounts.length++;
        Account storage account = accounts[accountId];
        account.metadata = _metadata;
        account.limit = _limit;
        account.token = _token;
        account.balance = 0;
        FundForwarder fund = new FundForwarder(accountId, this);
        account.proxy = address(fund);
        accountProxies[account.proxy] = accountId;
        emit NewAccount(accountId);
    }

    function fund(uint256 id) external payable {
        Account storage account = accounts[id];
        account.balance = account.balance.add(msg.value);
        emit FundAccount(id);
    }

    /**
    * @dev This function distributes the payouts to the candidates in accordance with the distribution values
    * @notice Send payout amounts to the candidates in accordance with the distribution proportions
    * @param _payoutId Any relevent label for the payout
    */
    function runPayout(uint _accountId, uint256 _payoutId) external auth(EXECUTE_PAYOUT_ROLE) returns(bool success) {
        Account storage account = accounts[_accountId];
        Payout storage payout = account.payouts[_payoutId];
        uint256 totalSupport;
        uint i;
        for (i = 0; i < payout.supports.length; i++) {
            totalSupport += payout.supports[i];
        }
        require(payout.distSet, "setDistribution must be called first");
        if (payout.recurring) {
            // TDDO create payout execution counter to ensure payout time tracks payouts
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

            if ( accountProxies[payout.candidateAddresses[i]] > 0 ) {
                Account storage candidateAccount = accounts[accountProxies[payout.candidateAddresses[i]]];
                candidateAccount.balance = candidateAccount.balance.add(individualPayout);
                account.balance = account.balance.sub(individualPayout);
            } else {
                payout.candidateAddresses[i].transfer(individualPayout);
                account.balance = account.balance.sub(individualPayout);
            }
        }
        success = true;
        emit PayoutExecuted(_accountId, _payoutId);
    }

    /**
    * @dev This is the function that the RangeVote will call. It doesn’t need
    *      to be called by a RangeVote (options get weird if it's not)
    *      but for our use case the “SET_DISTRIBUTION_ROLE” will be given to
    *      the RangeVote.
    * @notice Sets the distribution proportion for this allocation
    * @param _candidateAddresses Array of candidates to be allocated a portion of the payouut
    * @param _supports The Array of all support values for the various candidates. These values are set in range voting
    * @param _accountId The Account used for the payout
    * @param _recurring boolean used to indicate whether this is a recurring or one-time payout
    * @param _period time interval between each recurring payout
    * @param _amount The quantity of funds to be allocated
    */
    function setDistribution(
        address[] _candidateAddresses,
        uint256[] _supports,
        uint256[] /*unused_infoIndices*/,
        string /*unused_candidateInfo*/,
        uint256[] /*unused_level 1 ID - converted to bytes32*/,
        uint256[] /*unused_level 2 ID - converted to bytes32*/,
        uint256 _accountId,
        bool _recurring,
        uint256 _period,
        uint256 _amount
    ) public auth(SET_DISTRIBUTION_ROLE) returns(uint payoutId)
    {
        Account storage account = accounts[_accountId];
        Payout storage payout = account.payouts[account.payouts.length++];

        require(account.balance >= _amount, "payout account underfunded");
        require(account.limit >= _amount, "payout amount over account limit");

        payout.amount = _amount;
        payout.recurring = _recurring;
        payout.candidateAddresses = _candidateAddresses;

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
        emit SetDistribution(_accountId, account.payouts.length - 1);
    }

}
