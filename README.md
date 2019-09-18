# Open Enterprise
*Note: Open Enterprise is the new name of That Planning Suite. We still need to update the Github repo URL.*

[![Build Status](https://img.shields.io/travis/AutarkLabs/planning-suite.svg?style=flat-square)](https://travis-ci.org/AutarkLabs/planning-suite) [![Coverage Status](https://img.shields.io/coveralls/github/AutarkLabs/planning-suite.svg?style=flat-square)](https://coveralls.io/github/AutarkLabs/planning-suite)

<!-- markdownlint-disable MD033 -->
<p align="center">
  <a href="#development-setup">Development Setup</a> •
  <a href="#app-overview">App Overview</a> •
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

### Debugging contracts

If a call to a contract from the frontend fails, you may not get much information about the failure in the console. One of the best ways to troubleshoot is to tweak the contract code and try again, but restarting the whole development stack is time-consuming. Here's a way to make it faster:

1. Record the info that was sent to the contract from the frontend (you can log the values to your browser console). Example:

   ```js
   addBounties(["0x4d4445774f6c4a6c6347397a61585276636e6b784d6a59344f546b784e444d3d"], [1234], ["1000000000000000000"], [1568813389132], [0], ["0x0000000000000000000000000000000000000000"], 'Qmb1wpM8Yzs3pDmynGKgMGHkVUcdfnTjWnvTA7LJTuA167', 'Bounty description')
   ```

2. In your terminal, `cd` into the app folder for the app you're troubleshooting. Example: `cd apps/projects`

3. In that directory, run `truffle console`. This starts a node console with some extra goodies like [web3.js](https://web3js.readthedocs.io), thanks to [truffle](https://www.trufflesuite.com/docs/truffle/getting-started/using-truffle-develop-and-the-console). You can find out what versions of things you're using by typing `version`, so you're sure you're looking at the correct docs.

4. To read and write to your problematic contract, you will need its abi and its address.

   * **Address**: visit your app in your browser (e.g. click on "Projects" in the side bar) and look at the URL. It'll be something like:

     ```
     http://localhost:3000/#/0xb84dFbdc18069a83af4D5506096f5e7AC7554183/0x4eda83d4a45d4a00bd128a4002e7699490a87649
     ```

     The last bit there is the address of your smart contract. Save it in a variable in your truffle console:

     ```js
     addr = '0x4eda83d4a45d4a00bd128a4002e7699490a87649'
     ```

   * **abi**: When your contract is compiled, it creates an _application binary interface_, which web3.js needs in order to interact with the contract. This is saved in a json file in your app's directory. For the `Projects.sol` contract, the relevant JSON file is at `apps/projects/build/contracts/Projects.json`. To load the abi into your truffle console, you can do something like this:

     ```js
     let abi; fs.readFile('./build/contracts/Projects.json', 'utf-8', (err, data) => { if (err) { throw err } abi = JSON.parse(data).abi })
     ```

5. Instantiate your contract:

   ```js
   contract = new web3.eth.Contract(abi, addr)
   ```

6. Now you can directly call the method that you saved in step 1:

   ```js
   contract.methods.addBounties(...).call()
   ```

   Or query all its events:

   ```js
   contract.getPastEvents('allEvents')
   ```

   Or anything else listed in [the web3 docs](https://web3js.readthedocs.io/en/v1.2.1/web3-eth-contract.html)

7. Make changes to your contract code

8. Re-compile & deploy your contract

   ```
   ???
   ```

9. Reload the abi & contract in your truffle console:

   ```js
   fs.readFile('./build/contracts/Projects.json', 'utf-8', (err, data) => { if (err) { throw err } abi = JSON.parse(data).abi })
   contract = new web3.eth.Contract(abi, addr)
   ```

10. Now you can retry your function, repeating steps 7-9 until you get it working.


## App Overview

Open Enterprise is a collection of five Aragon Apps that supports the following:

- **Allocations:** The Allocations app is used to propose a financial allocation meant to be distributed to multiple parties. Allocation proposals are forwarded to the Dot Voting app. The percentage of the allocation amount distributed to each party is determined based on the results of the Dot Vote.
- **Address Book:** Maintain a list of Ethereum addresses mapped to human-readable names. The Address Book will enable a more user-friendly way to access and review common addresses a DAO uses for Allocations and Dot Voting.
- **Projects:** Allocate funding to multiple Github issues in a single action and collectively curate issues.
  - **Curate Issues:** Token holders will be able to curate / prioritize the top issues that should be developed. Issue Curation proposals are forwarded to the Dot Voting app.
  - **Fund Issues:** Fund issues in a bulk-fashion, with the possibility to require DAO approval before funding is allocated.
- **Dot Voting:** Dot Voting is used to cast votes for Allocation or Issue Curation proposals. Members can vote on how to distribute an allocation across distinct entities or prioritize a list of Github issues by specifying a percentage of votes per option.
- **Rewards:** Distributes payments to token holders based on the number of tokens one has earned in a specific cycle of time (one-time reward) or based on the total tokens one holds (dividend).

### [Review more details](https://www.autark.xyz/apps)


## Contact

We can be found in the [`autark.community` keybase channel](https://keybase.io/team/autark.community). If you have any questions or want to get involved in our development please drop in.

## Special Thanks

Special thanks to the Aragon Network for funding our work with three grants to date ([Nest](https://blog.aragon.one/introducing-aragon-nest-1aa8c91c0566), [AGP-19](https://github.com/aragon/AGPs/blob/master/AGPs/AGP-19.md), and [AGP-73](https://github.com/aragon/AGPs/blob/master/AGPs/AGP-73.md)).
