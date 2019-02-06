# Gas costs

## Address Book

```sh
  Contract: AddressBook App
    main context
      ✓ add to and get from addressbook (416479 gas)
      ✓ remove entry from addressbook (37902 gas)

·--------------------------------------------------------------------|-----------------------------·
|                                Gas                                 ·  Block limit: 50000000 gas  │
····································|································|······························
|  Methods                          ·           3 gwei/gas           ·       117.50 usd/eth        │
················|···················|··········|··········|··········|·············|················
|  Contract     ·  Method           ·  Min     ·  Max     ·  Avg     ·  # calls    ·  usd (avg)    │
················|···················|··········|··········|··········|·············|················
|  AddressBook  ·  addEntry         ·  138293  ·  139445  ·  138826  ·          3  ·         0.05  │
················|···················|··········|··········|··········|·············|················
|  AddressBook  ·  initialize       ·       -  ·       -  ·       -  ·          0  ·            -  │
················|···················|··········|··········|··········|·············|················
|  AddressBook  ·  removeEntry      ·       -  ·       -  ·   37902  ·          1  ·         0.01  │
················|···················|··········|··········|··········|·············|················
|  AddressBook  ·  transferToVault  ·       -  ·       -  ·       -  ·          0  ·            -  │
·---------------|-------------------|----------|----------|----------|-------------|---------------·

  2 passing (4s)
```

## Allocations

```sh
Contract: Allocations App
    app creation and funded Payout
      ✓ app initialized properly
      ✓ can create a new Payout
      ✓ sets the distribution
      ✓ executes the payout (77222 gas)
      ✓ cannot add to balance without passing equal msg.value (403715 gas)
    Informational Payout
      ✓ can create new Payout
      ✓ sets the distribution
      ✓ cannot accept funds (94958 gas)
      ✓ cannot execute (54885 gas)
    Recurring Payout
      ✓ cannot occur more frequently than daily (170982 gas)
      ✓ will not execute more frequently than the specified period (586082 gas)

·-------------------------------------------------------------------|-----------------------------·
|                                Gas                                ·  Block limit: 50000000 gas  │
····································|·······························|······························
|  Methods                          ·          3 gwei/gas           ·       117.54 usd/eth        │
················|···················|·········|·········|···········|···············|··············
|  Contract     ·  Method           ·  Min    ·  Max    ·  Avg      ·  # calls      ·  usd (avg)  │
················|···················|·········|·········|···········|···············|··············
|  Allocations  ·  fund             ·      -  ·      -  ·    52149  ·            2  ·       0.02  │
················|···················|·········|·········|···········|···············|··············
|  Allocations  ·  initialize       ·      -  ·      -  ·        -  ·            0  ·          -  │
················|···················|·········|·········|···········|···············|··············
|  Allocations  ·  newPayout        ·      -  ·      -  ·   247925  ·            1  ·       0.09  │
················|···················|·········|·········|···········|···············|··············
|  Allocations  ·  runPayout        ·  77222  ·  92541  ·    84882  ·            2  ·       0.03  │
················|···················|·········|·········|···········|···············|··············
|  Allocations  ·  setDistribution  ·      -  ·      -  ·   333270  ·            1  ·       0.12  │
················|···················|·········|·········|···········|···············|··············
|  Allocations  ·  transferToVault  ·      -  ·      -  ·        -  ·            0  ·          -  │
················|···················|·········|·········|···········|···············|··············
|  Deployments                      ·                               ·  % of limit   ·             │
····································|·········|·········|···········|···············|··············
|  Allocations                      ·      -  ·      -  ·  2835544  ·        5.7 %  ·       1.00  │
·-----------------------------------|---------|---------|-----------|---------------|-------------·

  11 passing (28s)
```

## Projects

```sh
Contract: Projects App
    creating and retrieving repos and bounties
      ✓ creates a repo id entry
      ✓ retrieve repo array length
      ✓ retrieve repo information successfully
      standard bounty verification tests
        ✓ verifies that the StandardBounties registry works
        ✓ verifies that simple bounty contribution and activation functions (100827 gas)
        ✓ verifies that basic fulfillment acceptance flow works (217881 gas)
        ✓ verifies that bounty fulfillment flow works to completion (352657 gas)
        ✓ verifies that bounty fulfillment flow works to completion with several fulfillments (432365 gas)
      issue, fulfill, and accept fulfillment for bulk bounties
        ✓ verifies bounty data contains correct IPFS hashes
        ✓ fulfill bounties and accept fulfillment (553337 gas)
        ✓ verify balance is correct before and after accepting fulfillment in standard bounty (553337 gas)
    invalid operations
      ✓ cannot retrieve a removed Repo (165569 gas)
      ✓ cannot add bounties to unregistered repos
      ✓ cannot issue bulk bounties with invalid value (118766 gas)
      ✓ cannot accept unfulfilled bounties (1479244 gas)
    issue curation
      ✓ should curate a single issue (88201 gas)
      - should curate multiple issues
      invalid issue curation operations
        - should revert on unusedAddresses length mismatch
        - should revert on unusedAddresses length mismatch
        - should revert on unusedAddresses length mismatch
        - should revert on unusedAddresses length mismatch
        - should revert if an issue has an already assigned bounty

·-----------------------------------------------------------------------|-----------------------------·
|                                  Gas                                  ·  Block limit: 50000000 gas  │
······································|·································|······························
|  Methods                            ·           3 gwei/gas            ·       117.50 usd/eth        │
·············|························|··········|··········|···········|···············|··············
|  Contract  ·  Method                ·  Min     ·  Max     ·  Avg      ·  # calls      ·  usd (avg)  │
·············|························|··········|··········|···········|···············|··············
|  Projects  ·  acceptFulfillment     ·   88479  ·   88543  ·    88534  ·            7  ·       0.03  │
·············|························|··········|··········|···········|···············|··············
|  Projects  ·  addBounties           ·       -  ·       -  ·  1116582  ·            1  ·       0.39  │
·············|························|··········|··········|···········|···············|··············
|  Projects  ·  addRepo               ·  118766  ·  122606  ·   120046  ·            3  ·       0.04  │
·············|························|··········|··········|···········|···············|··············
|  Projects  ·  changeBountySettings  ·       -  ·       -  ·        -  ·            0  ·          -  │
·············|························|··········|··········|···········|···············|··············
|  Projects  ·  curateIssues          ·       -  ·       -  ·    88201  ·            1  ·       0.03  │
·············|························|··········|··········|···········|···············|··············
|  Projects  ·  initialize            ·       -  ·       -  ·        -  ·            0  ·          -  │
·············|························|··········|··········|···········|···············|··············
|  Projects  ·  removeRepo            ·       -  ·       -  ·    46803  ·            1  ·       0.02  │
·············|························|··········|··········|···········|···············|··············
|  Projects  ·  transferToVault       ·       -  ·       -  ·        -  ·            0  ·          -  │
·············|························|··········|··········|···········|···············|··············
|  Deployments                        ·                                 ·  % of limit   ·             │
······································|··········|··········|···········|···············|··············
|  Projects                           ·       -  ·       -  ·  3524685  ·          7 %  ·       1.24  │
·-------------------------------------|----------|----------|-----------|---------------|-------------·

  16 passing (44s)
  6 pending
```

## Range Voting

```sh
Contract: RangeVoting App
    normal token supply
      ✓ fails on reinitialization (32779 gas)
      ✓ can create new vote (1434771 gas)
      ✓ can cast votes (1477625 gas)
      ✓ execution scripts can execute actions (2109774 gas)
      ✓ execution script can be empty (214803 gas)
      ✓ execution throws if any action on script throws (1300688 gas)
      ✓ forwarding creates vote (1268763 gas)
      - can change minimum candidate support
      creating vote with normal distributions
        ✓ has correct vote ID
        ✓ stored the candidate addresses correctly
        ✓ has correct state
        ✓ holder can vote (346393 gas)
        ✓ holder can modify vote (346393 gas)
        ✓ token transfers dont affect RangeVoting (335872 gas)
        ✓ cannot execute during open vote
        ✓ cannot execute if vote instance executed (971330 gas)
        ✓ can execute if vote has sufficient candidate support (534650 gas)
        ✓ cannot execute if vote has 0 candidate support (354138 gas)
        ✓ cannot execute if vote has insufficient candidate support (534650 gas)
        ✓ can execute vote if minimum participation (quorum) has been met (459330 gas)
        ✓ cannot execute vote if minimum participation (quorum) not met (459330 gas)
        ✓ holder can add candidates (236974 gas)
        ✓ holder can get total number of candidates
        ✓ holder can get vote metadata
    wrong initializations
      ✓ fails if min participation is 0 (52558 gas)
      ✓ fails if min candidate support is greater than min participation (53326 gas)
      ✓ fails if min participation is greater than 100 (53358 gas)
    before init
      ✓ fails creating a vote before initialization (31935 gas)

·--------------------------------------------------------------------------|-----------------------------·
|                                   Gas                                    ·  Block limit: 50000000 gas  │
········································|··································|······························
|  Methods                              ·            3 gwei/gas            ·       117.54 usd/eth        │
····················|···················|··········|···········|···········|···············|··············
|  Contract         ·  Method           ·  Min     ·  Max      ·  Avg      ·  # calls      ·  usd (avg)  │
····················|···················|··········|···········|···········|···············|··············
|  ExecutionTarget  ·  setSignal        ·       -  ·        -  ·        -  ·            0  ·          -  │
····················|···················|··········|···········|···········|···············|··············
|  RangeVotingMock  ·  addCandidate     ·  195800  ·   236974  ·   209844  ·            4  ·       0.07  │
····················|···················|··········|···········|···········|···············|··············
|  RangeVotingMock  ·  executeVote      ·  436680  ·   436701  ·   436691  ·            2  ·       0.15  │
····················|···················|··········|···········|···········|···············|··············
|  RangeVotingMock  ·  forward          ·       -  ·        -  ·  1268763  ·            1  ·       0.45  │
····················|···················|··········|···········|···········|···············|··············
|  RangeVotingMock  ·  initialize       ·       -  ·        -  ·        -  ·            0  ·          -  │
····················|···················|··········|···········|···········|···············|··············
|  RangeVotingMock  ·  newVote          ·  214803  ·  1449835  ·   959300  ·            5  ·       0.34  │
····················|···················|··········|···········|···········|···············|··············
|  RangeVotingMock  ·  transferToVault  ·       -  ·        -  ·        -  ·            0  ·          -  │
····················|···················|··········|···········|···········|···············|··············
|  RangeVotingMock  ·  vote             ·  118046  ·   225756  ·   171731  ·           26  ·       0.06  │
····················|···················|··········|···········|···········|···············|··············
|  Deployments                          ·                                  ·  % of limit   ·             │
········································|··········|···········|···········|···············|··············
|  ExecutionTarget                      ·       -  ·        -  ·   457299  ·        0.9 %  ·       0.16  │
········································|··········|···········|···········|···············|··············
|  RangeVotingMock                      ·       -  ·        -  ·  5358581  ·       10.7 %  ·       1.89  │
·---------------------------------------|----------|-----------|-----------|---------------|-------------·

  27 passing (1m)
  1 pending
```
