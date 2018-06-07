### Setup
In order to get the planning application we assume the following global dependencies:
Node LTS or greater
Python2.7
@aragon/cli@4.1.1

Assuming these have been installed run the following:
First in a seperate terminal run ``aragon devchain``

``cd apps/bare``
``npm i``
``npm run publish:rpc``
``cd ../range-voting``
``npm i``
``npm run start:kit``

In order to get the application working it may be necesary to run ``aragon devchain --reset``. If this doesn't work try deleting the ``public`` folder in ``apps/range-voting``.

### Background
The proposal for this [Aragon Planning app](https://github.com/aragon/nest/pull/24) was developed by members of [Space Decentral](https://spacedecentral.net) and [Giveth](https://giveth.io), and received funding via [Aragon's Nest program](https://blog.aragon.one/introducing-aragon-nest-1aa8c91c0566): an example of decentralization at it's finest. We are developing this app as a collaborative unit because it is a crucial building block for any organization that aims to coordinate work and streamline management duties, without traditional managers. This app will work with any ERC-20 token or Aragon DAO.

### Details

An organization should be able to seamlessly create and manage multiple projects using a Planning app. The basic system would require:
* **Voting Patterns:** Create two new voting patterns to support range voting and consensus-based voting. These patterns would be able to be utilized on various planning tools.
  * **Range Voting:** Allowing for votes to be placed as a range of numerals. This pattern can be applied to various tools such as issue curation and collective budgeting. 
  * **Consensus Voting:** A consensus voting smart contract would allow for special voting sessions to be created, where the aim is to reach consensus among the voting session participants.
* **Github Integration:** Before we can utilize the decentralized git tool, it would be ideal to have an integration with a Github-based bounty system to provide immediate utility to Aragon DAOs. 
* **Task Planning Toolkit:** Tools should be added to the Planning app that allow issues to be collectively prioritized in addition to applying bulk bounties.
  * **Issue Curation:** In the Planning app, token holders or project members will be able to curate / prioritize the top issues that should be developed.
  * **Bulk Bounties:** Smart contracts will be developed that allow bounties to be allocated to issues in a bulk-fashion.
    * **Off-Chain Estimates:** The bounty estimates are determined off-chain or are input by a single party, yet require an approval vote from the DAO
    * **On-Chain Estimates:** Consensus or range voting contract is utilized for members to collectively estimate the value of task bounties. (Planning Poker)
* **Financial Planning Toolkit:** Tools should be added to the Planning app that allow for collective budgeting in addition to distributing rewards and dividends to token holders.
  * **Fixed Payout:** Payroll contract that allows an easy way to setup a recurring fixed allocations to projects or other DAOs.
  * **Dynamic Payout:** Payroll contract that allows for dynamic allocations that are determined using range voting.
  * **Payout Engine:** Pay sharing contract using a percentage-based distribution system, where the percentages are determined using range voting.
  * **Rewards Engine:** Distributes payments to token holders based on the number of tokens one has earned in a specific cycle of time (one-time reward) or based on the total tokens one holds (dividend).

#### Stretch Goals
* **Project Proposal:** Creating a user flow that makes the Project Proposal process more efficient.
* **Reputation Marketplace:** A reputation model will maintain the rules for how contributors can collect non-transferrable reputation tokens that will help with decentralizing management. With the reputation marketplace, organizations can experiment with or create different reputation models.
* **DAI Exchange:** Using a stable currency to allocate bounties will be important in some use cases to provide contributors peace of mind that the volatility of the market will not affect their ultimate payout. 

As part of the set of deliverables for this proposal, an enhancement plan will be developed for how the smart contracts can become cross-compatible with the decentralized git solution. Although ideally, we hope to work closely with the decentralized git team to have that cross-compatibility whenever the decentralized git solution deploys to Mainnet. We are happy to discuss this aspect of the strategy further. 

Ultimately, we do not want to build smart contracts that are “married” to Github, although we expect that it may take some time until all organizations fully transfer to the decentralized git solution, so offering cross-compatibility may be the best approach.

#### Please review the [White Paper](http://goo.gl/eXAybm) for full details.

### Design Concepts
These are some initial concepts. We expect to refine them and gather community feedback once approved.
#### Planning Landing Page
![ara_planning](https://user-images.githubusercontent.com/2584493/36969323-72536286-2065-11e8-825a-e6c0a3c100f1.png)

#### Issue Curation using Range Voting
![ara_planning2](https://user-images.githubusercontent.com/2584493/36969331-76f20d24-2065-11e8-8ccc-ccf2fe9be61c.png)

### Flow Diagram
#### Financial Planning Toolkit
Hypothetical flow diagram. The components should be "plug and play" to design a rewards system tailored to an organization's unique needs.
![image](https://user-images.githubusercontent.com/2584493/36970345-91ff7ee6-2068-11e8-94a6-968f055b7ebc.png)

