## Getting Started with That Planning Suite


## Install Dot Voting App
#### Package: tps-dot-voting.open.aragonpm.eth

The Dot Voting app is used by both Autark's Allocations app and the Projects app. Dot Voting allows token holders to prioritize between multiple options by distributing votes across multiple options.

Parameters: addressBook (proxy address), token (minime token address), minParticipationPct (percentage required for approval), candidateSupportPct (set this to zero, feature not enabled), voteDuration


Sample command:
```
dao --environment aragon:rinkeby install dune.aragonid.eth tps-dot-voting.open.aragonpm.eth --app-init-args [AddressBook] [MinimeToken] 500000000000000000 0 3600
```


## Initial Permissions 
### Core Apps

| App               | Permission            | Grantee | Manager |
| ----------------- | --------------------- | ------- | ------- |
| Voting            | CREATE_VOTES          | Any     | Voting  |
| Voting            | MODIFY_QUORUM         | Voting  | Voting  |
| Voting            | MODIFY_SUPPORT        | None    | Burned  |
| Vault             | TRANSFER              | Finance | Voting  |
| Vault             | TRANSFER              | Projects | Voting  |
| Vault             | TRANSFER              | Rewards | Voting  |
| Vault             | TRANSFER              | Allocations | Voting  |
| Finance           | CREATE_PAYMENTS       | Voting  | Voting  |
| Finance           | EXECUTE_PAYMENTS      | Voting  | Voting  |
| Finance           | DISABLE_PAYMENTS      | Voting  | Voting  |
| Token Manager     | ASSIGN                | Voting  | Voting  |
| Token Manager     | REVOKE_VESTINGS       | Voting  | Voting  |
| Kernel            | APP_MANAGER           | Voting  | Voting  |
| ACL               | CREATE_PERMISSIONS    | Voting  | Voting  |
| EVMScriptRegistry | REGISTRY_ADD_EXECUTOR | Voting  | Voting  |
| EVMScriptRegistry | REGISTRY_MANAGER      | Voting  | Voting  |

### That Planning Suite Apps

| App               | Permission               | Grantee    | Manager |
| ----------------- | ------------------------ | ---------- | ------- |
| Address Book      | ADD_ENTRY_ROLE           | Voting     | Voting  |
| Address Book      | REMOVE_ENTRY_ROLE        | Voting     | Voting  |
| Projects          | FUND_ISSUES_ROLE         | Voting      | Voting  |
| Projects          | REVIEW_APPLICATION_ROLE  | Voting      | Voting  |
| Projects          | WORK_REVIEW_ROLE         | Voting      | Voting  |
| Projects          | ADD_REPO_ROLE            | Voting     | Voting  |
| Projects          | REMOVE_REPO_ROLE         | Voting     | Voting  |
| Projects          | CHANGE_SETTINGS_ROLE     | Voting     | Voting  |
| Projects          | CURATE_ISSUES_ROLE       | Dot Voting | Voting  |
| Dot Voting        | CREATE_VOTES_ROLE        | Any        | Voting  |
| Dot Voting        | ADD_CANDIDATES_ROLE      | Any        | Voting  |
| Allocations       | CREATE_ACCOUNT_ROLE      | Voting     | Voting  |
| Allocations       | CREATE_ALLOCATION_ROLE   | Dot Voting | Voting  |
| Allocations       | EXECUTE_ALLOCATION_ROLE  | Any        | Voting  |
| Rewards           | ADD_REWARD_ROLE          | Voting        | Voting  |



## to do
allocations.initialize(addressBook, vault);
projects.initialize(registry, vault, token);
rewards.initialize(vault);
addressBook.initialize();
dotVoting.initialize(addressBook, token, minParticipationPct, candidateSupportPct, voteDuration);