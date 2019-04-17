# Planning Suite DAO Template

## What's a DAO Kit

[Aragon dao-kits](https://github.com/aragon/dao-kits)

This is a kit customized from [Aragon beta templates](https://github.com/aragon/dao-kits/blob/master/kits/beta-base/readme.md).

## Rinkeby-ready kit

Autark creates and certifies this kit. This comes without any guarantees, a kit we consider secure today may be vulnerable to an unknown security hole discovered down the road.

At the moment, the kit is deployed on rinkeby:

- [PlanningSuite](./contracts/PlanningKit.sol): `planning-suite.open.aragonpm.eth`

You can find more information about kit deployments and their addresses in the [deployments package](../../shared/deployments/README.md)

## Usage

```js
planningSuite.newInstance(
  name,
  symbol,
  holders,
  stakes,
  supportNeeded,
  minAcceptanceQuorum,
  candidateSupportPct,
  minParticipationPct,
  voteDuration
)
```

## Parameter Definitions

| Parameter             | Description                                                                                                                     | Example (human-readable) | Contract input                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------- |
| `name`                | Name for org, will assign `[name].aragonid.eth` (check capitalization and forbidden characters)                                 | autark                   | autark                                        |
| `symbol`              | Symbol for token                                                                                                                | AUT                      | AUT                                           |
| `holders`             | Array of token holder addresses                                                                                                 | 0xA... and 0xB...        | '["0xA...", "0xB..." ]'                       |
| `stakes`              | Array of token stakes for holders (token has 18 decimals, multiply token amount `* 10^18`)                                      | 10 each                  | '["100000000000000000", "100000000000000000"] |
| `supportNeeded`       | Voting App: Percentage of Yeas in casted votes for a vote to succeed .                                                          | 50%                      | 500000000000000000                            |
| `minAcceptanceQuorum` | Voting App: Percentage of Yeas in total possible votes for a vote to succeed.                                                   | 30%                      | 300000000000000000                            |
| `candidateSupportPct` | Dot Voting App: Minimum % of an option needs for it be considered valid.                                                        | 50%                      | 50000000000000000                             |
| `minParticipationPct` | Dot Voting App: Minimum % of all token supply that needs to participate in the Dot Vote in order for the vote to be executed. | 30%                      | 300000000000000000                            |
| `voteDuration`        | The amount of time a Voting or Dot Voting proposal will be open (in seconds).                                                   | 7 days                   | 604800                                        |

Check [Voting app spec](https://wiki.aragon.org/dev/apps/voting/) for some details and examples

## Deploying templates

After deploying ENS, APM and AragonID. Change `index.js` ENS address for the
deployment network.

Then just:

```sh
npm run deploy:rinkeby
```

## Permissions

| App               | Permission            | Grantee | Manager |
| ----------------- | --------------------- | ------- | ------- |
| Voting            | CREATE_VOTES          | Any     | Voting  |
| Voting            | MODIFY_QUORUM         | Voting  | Voting  |
| Voting            | MODIFY_SUPPORT        | None    | Burned  |
| Vault             | TRANSFER              | Finance | Voting  |
| Finance           | CREATE_PAYMENTS       | Voting  | Voting  |
| Finance           | EXECUTE_PAYMENTS      | Voting  | Voting  |
| Finance           | DISABLE_PAYMENTS      | Voting  | Voting  |
| Token Manager     | ASSIGN                | Voting  | Voting  |
| Token Manager     | REVOKE_VESTINGS       | Voting  | Voting  |
| Kernel            | APP_MANAGER           | Voting  | Voting  |
| ACL               | CREATE_PERMISSIONS    | Voting  | Voting  |
| EVMScriptRegistry | REGISTRY_ADD_EXECUTOR | Voting  | Voting  |
| EVMScriptRegistry | REGISTRY_MANAGER      | Voting  | Voting  |

## Gas usage

Tested running `GAS_REPORTER=true truffle test --network devnet test/gas.js`, plus `deploy-kit.js` script in `beta-base`.

- Create the Kit: 2816197
- Create new token: 1738117
- Deploy new instance: 5690035
