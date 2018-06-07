pragma solidity ^0.4.18;

import "@aragon/os/contracts/apps/AragonApp.sol";

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
    }

    bool distSet = false;

    Payout payout;

    bytes32 constant public START_PAYOUT_ROLE = keccak256("START_PAYOUT_ROLE");
    bytes32 constant public SET_DISTRIBUTION_ROLE = keccak256("SET_DISTRIBUTION_ROLE");

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
        bytes32[] _candidateKeys,
        address[] _candidateAddresses,
        string _metadata
    ) external auth(START_PAYOUT_ROLE) {
        payout.candidateKeys = _candidateKeys;
        payout.candidateAddresses = _candidateAddresses;
        payout.metadata = _metadata;
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
    function setDistribution(bytes32[] _candidateKeys, uint256[] _supports) external auth(SET_DISTRIBUTION_ROLE){
        distSet = true;
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
    function runPayout() external payable{
        require(distSet);
        uint256 totalSupport;
        uint256 pointsPer;

        for(uint i = 0; i < payout.supports.length; i++){
            totalSupport += payout.supports[i];
        }

        pointsPer = this.balance.div(totalSupport);

        for(i = 0; i < payout.candidateAddresses.length; i++){
            payout.candidateAddresses[i].transfer(payout.supports[i].mul(pointsPer));
        }
    }

    function () public payable {

    }

}
