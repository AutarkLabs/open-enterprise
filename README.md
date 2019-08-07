# Open Enterprise
*Note: Open Enterprise is the new name of That Planning Suite. We still need to update the Github URL.*

[![Build Status](https://img.shields.io/travis/AutarkLabs/planning-suite.svg?style=flat-square)](https://travis-ci.org/AutarkLabs/planning-suite) [![Coverage Status](https://img.shields.io/coveralls/github/AutarkLabs/planning-suite.svg?style=flat-square)](https://coveralls.io/github/AutarkLabs/planning-suite)

<!-- markdownlint-disable MD033 -->
<p align="center">
  <a href="#development-setup">Development Setup</a> •
  <a href="#app-overview">App Overview</a> •
  <a href="#design-concepts">Design Concepts</a> •
  <a href="#contact">Contact</a>
</p>
<!-- markdownlint-enable MD033 -->

Open Enterprise is a collection of Aragon apps that enable organizations to curate issues, collectively budget, and design custom reward and bounty programs. If you are interested in viewing app demos or want to install them to your Rinkeby organizations, learn more here:
https://www.autark.xyz/apps

**Release status:** The apps are currently on Rinkeby and undergoing a security audit and UX enhancements. The apps will be released to mainnet in Q4 2019.


## Development Setup

Node.js LTS or greater required.

- Note: @aragon/cli and truffle npm deps are automatically installed when bootstrapping.

```bash
# Bootstrap project dependencies:
$ npm i

# Start a local blockchain and deploy
# aragon dao kit with all apps:
$ npm start

# Develop single app react frontend:
$ npm run dev:projects

# Develop single app with backend and aragon wrapper:
$ npm run start:dot

# current app name aliases: {address, allocations, dot, projects, rewards}
```

### Extra tips

- Individual development is ultra-fast thanks to parcel and hot module replacement.
- Start the dao kit to manage smart contracts interactions between all "planning apps" and aragon official apps (token manager and voting right now)
- The start script spawns a local blockchain, needed to publish the apps before deploying the dao kit template with all them.

**Detailed information in the [DEVELOPMENT_NOTES.md](/docs/DEVELOPMENT_NOTES.md) document.**

## App Overview

The Planning Suite is a collection of five Aragon Apps that supports the following:

- **Allocations:** The Allocations app is used to propose a financial allocation meant to be distributed to multiple parties. Allocation proposals are forwarded to the Dot Voting app. The percentage of the allocation amount distributed to each party is determined based on the results of the Dot Vote.
- **Address Book:** Maintain a list of Ethereum addresses mapped to human-readable names. The Address Book will enable a more user-friendly way to access and review common addresses a DAO uses for Allocations and Dot Voting.
- **Projects:** Allocate funding to multiple Github issues in a single action and collectively curate issues.
  - **Curate Issues:** Token holders will be able to curate / prioritize the top issues that should be developed. Issue Curation proposals are forwarded to the Dot Voting app.
  - **Fund Issues:** Fund issues in a bulk-fashion, with the possibility to require DAO approval before funding is allocated.
- **Dot Voting:** Dot Voting is used to cast votes for Allocation or Issue Curation proposals. Members can vote on how to distribute an allocation across distinct entities or prioritize a list of Github issues by specifying a percentage of votes per option.
- **Rewards:** Distributes payments to token holders based on the number of tokens one has earned in a specific cycle of time (one-time reward) or based on the total tokens one holds (dividend).

### [Review more details](https://www.autark.xyz/apps)

## Design Concepts

These are some initial concepts. We expect to refine them and gather community feedback once approved.

### Projects App

![ara_planning1](https://uploads-ssl.webflow.com/5d1c488f1ded343e61367f25/5d3ed807b1eba412922190ce_Projects-1-p-1080.png)

#### Allocations App

![ara_planning2](https://uploads-ssl.webflow.com/5d1c488f1ded343e61367f25/5d3ed881cb7dfd5a9cf80747_Allocations-1-p-1080.png)

#### Rewards App

![ara_planning3](https://uploads-ssl.webflow.com/5d1c488f1ded343e61367f25/5d3ed90373102c7f44c763f1_Rewards-2-p-1080.png)


## Contact

We can be found in the [`autark.community` keybase channel](https://keybase.io/team/autark.community). If you have any questions or want to get involved in our development please drop in.

## Special Thanks

Special thanks to the Aragon Network for funding our work with three grants to date ([Nest](https://blog.aragon.one/introducing-aragon-nest-1aa8c91c0566), [AGP-19](https://github.com/aragon/AGPs/blob/master/AGPs/AGP-19.md), and [AGP-73](https://github.com/aragon/AGPs/blob/master/AGPs/AGP-73.md).
