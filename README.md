# That Planning Suite

[![Build Status](https://img.shields.io/travis/AutarkLabs/planning-suite.svg?style=flat-square)](https://travis-ci.org/AutarkLabs/planning-suite) [![Coverage Status](https://img.shields.io/coveralls/github/AutarkLabs/planning-suite.svg?style=flat-square)](https://coveralls.io/github/AutarkLabs/planning-suite)

<!-- markdownlint-disable MD033 -->
<p align="center">
  <a href="#development-setup">Development Setup</a> •
  <a href="#background">Background</a> •
  <a href="#details">Details</a> •
  <a href="#design-concepts">Design Concepts</a> •
  <a href="#contact">Contact</a>
</p>
<!-- markdownlint-enable MD033 -->

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

# current app name aliases: {address, projects, payout, dot}
```

### Extra tips

- Individual development is ultra-fast thanks to parcel and hot module replacement.
- Start the dao kit to manage smart contracts interactions between all "planning apps" and aragon official apps (token manager and voting right now)
- The start script spawns a local blockchain, needed to publish the apps before deploying the dao kit template with all them.

**Detailed information in the [DEVELOPMENT_NOTES.md](/docs/DEVELOPMENT_NOTES.md) document.**

## Background

The proposal for an Aragon [Planning Suite](https://github.com/aragon/nest/pull/24) was developed by members of [Autark](https://autark.xyz), and received funding via [Aragon's Nest program](https://blog.aragon.one/introducing-aragon-nest-1aa8c91c0566): an example of decentralization at it's finest. We are developing this app as a collaborative unit because it is a crucial building block for any organization that aims to coordinate work and streamline management duties, without traditional managers. These apps will work with MiniMe ERC-20 tokens or Aragon DAOs.

## The Suite

The Planning Suite is a collection of five Aragon Apps that supports the following:

- **Allocations:** The Allocations app is used to propose a financial allocation meant to be distributed to multiple parties. Allocation proposals are forwarded to the Dot Voting app. The percentage of the allocation amount distributed to each party is determined based on the results of the Dot Vote.
- **Address Book:** Maintain a list of Ethereum addresses mapped to human-readable names. The Address Book will enable a more user-friendly way to access and review common addresses a DAO uses for Allocations and Dot Voting.
- **Projects:** Allocate funding to multiple Github issues in a single action and collectively curate issues.
  - **Curate Issues:** Token holders will be able to curate / prioritize the top issues that should be developed. Issue Curation proposals are forwarded to the Dot Voting app.
  - **Fund Issues:** Fund issues in a bulk-fashion, with the possibility to require DAO approval before funding is allocated.
- **Dot Voting:** Dot Voting is used to cast votes for Allocation or Issue Curation proposals. Members can vote on how to distribute an allocation across distinct entities or prioritize a list of Github issues by specifying a percentage of votes per option.
- **Rewards:** Distributes payments to token holders based on the number of tokens one has earned in a specific cycle of time (one-time reward) or based on the total tokens one holds (dividend).

### Please review the [White Paper](http://goo.gl/eXAybm) for full details

## Design Concepts

These are some initial concepts. We expect to refine them and gather community feedback once approved.

### Projects App

![ara_planning1](docs/screenshots/Projects_app.jpg)

#### Allocations App

![ara_planning2](docs/screenshots/Allocations_app.jpg)

#### Rewards App

![ara_planning3](docs/screenshots/Rewards_app.jpg)

#### Issue Curation using Dot Voting

![ara_planning4](docs/screenshots/dot_vote_issue.jpg)

### Flow Diagram

#### Financial Planning Toolkit

Hypothetical flow diagram. The components should be "plug and play" to design a rewards system tailored to an organization's unique needs.
![image](https://user-images.githubusercontent.com/2584493/36970345-91ff7ee6-2068-11e8-94a6-968f055b7ebc.png)

## Contact

We can  be found in the [`autark.community` keybase channel](https://keybase.io/team/autark.community). If you have any questions or want to get involved in our development please drop in.

## Special Thanks

Special thanks go to the Aragon team for much of the work this project is based on, as well as for allocating us this grant to build the tools we need to DAOify open source development!
