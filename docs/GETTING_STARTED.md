# Installing Open Enterprise
You can create a new organization that comes preconfigured with Open Enterprise by visiting [mainnet.aragon.org](https://mainnet.aragon.org) or a test organization on [rinkeby.aragon.org](https://rinkeby.aragon.org). The governance for the Open Enterprise template that is there today is based on a DAO governed by members who hold transferable tokens. In the future we will have a few more template options for you. But with the installation instructions below, you can create more customized DAOs based on your preferences, using the aragonCLI.

For more details about the template, [read this guide](https://autark.gitbook.io/open-enterprise/getting-started).

# Installing Open Enterprise apps via aragonCLI to an Existing DAO
The following are instructions to install Open Enterprise apps using the aragonCLI. Refer [to this guide](https://hack.aragon.org/docs/guides-custom-deploy) for more information on installing the cli and creating a DAO with it, if you haven't already done that.

## aragonCLI primer

The basic command to install an app is:

#### App with no initialization parameters

```
dao install <dao-addr> <app-apm-repo> 
```

#### App with initialization parameters (two for example)
```
dao install <dao-addr> <app-apm-repo> --app-init-args <param1> <param2>
```

Be sure to also pass the `--environment aragon:rinkeby` flag if you are working with a rinkeby organization. 

### Bash Variables
It's easier to install apps and setup permissions when following along with these instructions if you set up bash variables for the organization and app proxy addresses that you're going to be using repetitively. You can do that with a command like the following (except replacing the address of course):

```
$dao=0x9a92dDDf3e69B981bD9D9Ac725E217039556C5a3
```

Assuming you also do this for the Voting and Tokens apps, a sample command to set up the `CREATE_VOTES` permission of the Voting app so Token holders can create votes and changes to the permission would be managed by votes, would be as follows:

```
dao acl create $dao $voting CREATE_VOTES $tokens $voting
```

### Permissions
In order to make the apps appear in the UI, you need to initialize at least one permission per app via the cli. Once you setup at least one permission via the cli, you can do the rest in the UI via Permissions.


The command to set permissions is:

```
dao acl create $dao <app-proxy-address> <permission-name> <grantee> <manager>
```

In order to get the proxy address of apps that do not have permissions, you need to run the following command:
```
dao apps $dao --all
```
You should see a list of apps, and freshly installed apps will be listed at the bottom, in the "permissionless apps" section, in the order in which they were installed.

Read about acl commands on the [Aragon wiki](https://hack.aragon.org/docs/cli-dao-commands#dao-acl-create), and refer to the end of this document for the initial permissions that we set via the Open Enterprise template that you may want to consider as well. The [1hive DAO has also designed a custom implementation](https://github.com/1Hive/1hive-dao) of Open Enterprise configurations that we feel is a very ideal governance model and we recommend looking into that after you gain more familiarity. We plan to provide more official support to a model similar to this as a template soon.


### Additional Vault
In the early mainnet phases, you may want to consider installing a second (or third) vaults that will be used for Open Enterprise apps such as Projects and Rewards so you can have more control over budgeting. You can transfer funding from the Finance app / your primary vault into smaller funding pools in these additional vault(s).



# Install Address Book
#### address-book.aragonpm.eth

The Address Book is for maintaining a list of Ethereum addresses mapped to human-readable names, on-chain. The Address Book will enable a more user-friendly way to access and review common addresses a DAO uses throughout Aragon.

The address book does not require passing any initialization parameters.

Note: in the examples below, `$dao`, `$address-book` etc. are bash variables that would be the organization address or app proxy address. Read the [bash variables](#bash-variables) section of this document for more details.

#### Sample install command

```
dao install $dao address-book.aragonpm.eth
```

### Recommended permission settings
You need to setup at least one of the permissions using the CLI for the app to show up in the UI. Once you do that, the additional permissions can be set up in the Permissions UI in your Aragon DAO.

| Permission               | Description               | Grantee    | Manager |
| ------------------------- | ------------------------- | ------- | ---- |
| ADD_ENTRY_ROLE           | Add address book entity   | Voting     | Voting  |
| REMOVE_ENTRY_ROLE        | Remove address book entity | Voting     | Voting  |
| UPDATE_ENTRY_ROLE        | Update address book entity | Voting     | Voting  |


#### Sample permission command
```
dao acl create $dao $address-book ADD_ENTRY_ROLE $voting $voting
```

# Install Dot Voting App
#### dot-voting.aragonpm.eth

The Dot Voting app is used by both the Allocations app and Projects app. Dot Voting allows token holders to prioritize between multiple options by distributing votes across these options.

The Dot Voting app requires the following initialization parameters:

* `MinimeToken`: Address of a minime token, where the holders of this token will be the eligible voters
* `minQuorum`: percentage of total votes required for a vote to succeed (expressed as a percentage of 10^18; eg. 10^16 = 1%, 10^18 = 100%)
* `candidateSupportPct`: Minimum percentage required for an option to be valid.
* `voteDuration`: Seconds that a vote will be open for token holders to participate in the vote.

Note: in the examples below, `$dao`, `$dot-voting` etc. are bash variables that would be the organization address or app proxy address. Read the [bash variables](#bash-variables) section of this document for more details.

#### Sample install command
This will install a Dot Voting instance with a participation requirement of 50% and a voting period of 7 days.
```
dao install $dao dot-voting.aragonpm.eth --app-init-args $MinimeToken 500000000000000000 0 604800
```

### Recommended permission settings
You need to setup at least one of the permissions using the CLI for the app to show up in the UI. Once you do that, the additional permissions can be set up in the Permissions UI in your Aragon DAO.

| Permission               | Description               | Grantee    | Manager |
| ------------------------- | ------------------------- | ------- | ---- |
| ROLE_CREATE_VOTES        | Create new dot votes | Tokens        | Voting  |
| ROLE_ADD_CANDIDATES      | Add options to an open dot vote | Tokens        | Voting  |
| ROLE_MODIFY_QUORUM      | Update minimum participation percentage | Not assigned        | Not assigned  |
| ROLE_MODIFY_CANDIDATE_SUPPORT      | Update support required for dot voting option to be valid | Not assigned        | Not assigned  |


#### Sample permission command
```
dao acl create $dao $dot-voting ROLE_CREATE_VOTES $tokens $voting
```


# Install the Projects app
#### projects.aragonpm.eth

Proects allows an organization to manage a bounties workflow using Github and the Standard Bounties contract. Issue Curation proposals can also be created via the Projects app, which are forwarded to the Dot Voting app to collectively determine project priorities.

The Projects app requires the following initialization parameters:
* `registry`: The Standard Bounties registry address. Use `0x38f1886081759f7d352c28984908d04e8d2205a6` for the Rinkeby registry and `0x51598aE36102010fECA5322098b22Dd5B773428B` for the Mainnet registry.
* `vault`: proxy address of the Vault you want to connect with the app


Note: in the examples below, `$dao`, `$projects` etc. are bash variables that would be the organization address or app proxy address. Read the [bash variables](#bash-variables) section of this document for more details.

#### Sample install command
```
dao install $dao projects.aragonpm.eth --app-init-args $registry $vault
```

### Recommended permission settings
You need to setup at least one of the permissions using the CLI for the app to show up in the UI. Once you do that, the additional permissions can be set up in the Permissions UI in your Aragon DAO.

For the Projects app, we feel it is more optimal to first create a "project manager" class of members by installing a new Tokens app instance, and then assigning that Tokens app as the Grantee. If you need help with this, please [reach out to us on Keybase](https://keybase.io/team/autark.community).

| Permission               | Description               | Grantee    | Manager |
| ------------------------- | ------------------------- | ------- | ---- |
| FUND_ISSUES_ROLE         | Fund issues that require applications | Tokens      | Voting  |
| REVIEW_APPLICATION_ROLE  | Approve or reject applications to work on issues | Tokens      | Voting  |
| WORK_REVIEW_ROLE         | Approve or reject work submissions on issues | Tokens      | Voting  |
| ADD_REPO_ROLE            | Add projects | Tokens     | Voting  |
| REMOVE_REPO_ROLE         | Remove projects | Tokens     | Voting  |
| CHANGE_SETTINGS_ROLE     | Update project settings | Voting     | Voting  |
| FUND_OPEN_ISSUES_ROLE    | Fund open-submission issues | Tokens     | Voting  |
| REMOVE_ISSUES_ROLE       | Remove funding from issues | Tokens     | Voting  |
| UPDATE_BOUNTIES_ROLE     | Update bounty data | Tokens     | Voting  |
| CURATE_ISSUES_ROLE       | Create issue curation votes | Dot Voting | Voting  |

#### Sample permission command
```
dao acl create $dao $projects FUND_ISSUES_ROLE $tokens $voting
```

# Install the Rewards app
#### rewards.aragonpm.eth

With Rewards, you can distribute payments to token holders based on the number of tokens one has earned in a specific cycle of time (one-time reward) or based on the total tokens one holds (dividend).

The Rewards app requires the following initialization parameter:
* `Vault`: proxy address of the Vault you want to connect with the app

Note: in the examples below, `$dao`, `$rewards` etc. are bash variables that would be the organization address or app proxy address. Read the [bash variables](#bash-variables) section of this document for more details.


#### Sample install command
```
dao install $dao rewards.aragonpm.eth --app-init-args $vault
```

### Recommended permission settings
You need to setup the rewards permission using the CLI for the app to show up in the UI.

| Permission               | Description               | Grantee    | Manager |
| ------------------------- | ------------------------- | ------- | ---- |
| ADD_REWARD_ROLE          | Create a new reward | Voting        | Voting  |

#### Sample permission command
```
dao acl create $dao $rewards ADD_REWARD_ROLE $voting $voting
```

# Install the Allocations app
#### allocations.aragonpm.eth

Allocations is used to manage budget-controlled, multi-party financial allocations. Proposals are forwarded to the Dot Voting app for an organization to collectively determine the distribution of funds. The percentage of the allocation amount distributed to each party is determined based on the results of the Dot Vote.

The Allocations app requires the following initialization parameter:
* `vault`: proxy address of the Vault you want to connect with the app
* `period`: The accounting period for the budgets, to control the maximum allocations that can be created in the period for a category. This period is global to all budgets.

Note: in the examples below, `$dao`, `$allocations` etc. are bash variables that would be the organization address or app proxy address. Read the [bash variables](#bash-variables) section of this document for more details.


#### Sample install command
This will install an Allocations instance with with an accounting period of 30 days.
```
dao install $dao allocations.aragonpm.eth --app-init-args $vault 2592000
```
### Recommended permission settings
You need to setup at least one of the permissions using the CLI for the app to show up in the UI. Once you do that, the additional permissions can be set up in the Permissions UI in your Aragon DAO.

| Permission               | Description               | Grantee    | Manager |
| ------------------------- | ------------------------- | ------- | ---- |
| CREATE_ACCOUNT_ROLE      | Create allocation budget | Voting     | Voting  |
| CHANGE_BUDGETS_ROLE      | Update allocations budgets | Voting     | Voting  |
| CREATE_ALLOCATION_ROLE   | Create allocation dot vote | Dot Voting | Voting  |
| EXECUTE_ALLOCATION_ROLE  | Execute allocation | Any        | Voting  |
| EXECUTE_PAYOUT_ROLE  | Execute allocation for a single option | Any        | Voting  |

#### Sample permission command
```
dao acl create $dao $allocations CREATE_ACCOUNT_ROLE $voting $voting
```


# Open Enterprise Template - Initial Permission Set
The following are the initial permissions that are setup when a new organization is created using the Open Enterprise template. You may want to consider customizing them for finer control over your organization, as most actions are set up to so a vote is required for the action to process.

We especially recommend re-evaluating the permissions of the the Projects app, as we feel it is more optimal to first create a "project manager" class of members by installing a new Tokens app instance, and then assigning that Tokens app as the Grantee for some of the management actions. If you need help with this, please [reach out to us on Keybase](https://keybase.io/team/autark.community).

### Open Enterprise Apps

| App               | Permission               | Description               | Grantee    | Manager |
| ----------------- | ------------------------ | ------------------------- | ------- | ---- |
| Address Book      | ADD_ENTRY_ROLE           | Add address book entity   | Voting     | Voting  |
| Address Book      | REMOVE_ENTRY_ROLE        | Remove address book entity | Voting     | Voting  |
| Address Book      | UPDATE_ENTRY_ROLE        | Update address book entity | Voting     | Voting  |
| Projects          | FUND_ISSUES_ROLE         | Fund issues that require applications | Voting      | Voting  |
| Projects          | REVIEW_APPLICATION_ROLE  | Approve or reject applications to work on issues | Voting      | Voting  |
| Projects          | WORK_REVIEW_ROLE         | Approve or reject work submissions on issues | Voting      | Voting  |
| Projects          | ADD_REPO_ROLE            | Add projects | Voting     | Voting  |
| Projects          | REMOVE_REPO_ROLE         | Remove projects | Voting     | Voting  |
| Projects          | CHANGE_SETTINGS_ROLE     | Update project settings | Voting     | Voting  |
| Projects          | FUND_OPEN_ISSUES_ROLE    | Fund open-submission issues | Voting     | Voting  |
| Projects          | REMOVE_ISSUES_ROLE       | Remove funding from issues | Voting     | Voting  |
| Projects          | UPDATE_BOUNTIES_ROLE     | Update bounty data | Voting     | Voting  |
| Projects          | CURATE_ISSUES_ROLE       | Create issue curation votes | Dot Voting | Voting  |
| Dot Voting        | ROLE_CREATE_VOTES        | Create new dot votes | Tokens        | Voting  |
| Dot Voting        | ROLE_ADD_CANDIDATES      | Add options to an open dot vote | Tokens        | Voting  |
| Dot Voting        | ROLE_MODIFY_QUORUM      | Update minimum participation percentage | Not assigned        | Not assigned  |
| Dot Voting        | ROLE_MODIFY_CANDIDATE_SUPPORT      | Update support required for dot voting option to be valid | Not assigned        | Not assigned  |
| Allocations       | CREATE_ACCOUNT_ROLE      | Create allocation budget | Voting     | Voting  |
| Allocations       | CHANGE_BUDGETS_ROLE      | Update allocations budgets | Voting     | Voting  |
| Allocations       | CREATE_ALLOCATION_ROLE   | Create allocation dot vote | Dot Voting | Voting  |
| Allocations       | EXECUTE_ALLOCATION_ROLE  | Execute allocation | Any        | Voting  |
| Allocations       | EXECUTE_PAYOUT_ROLE  | Execute allocation for a single option | Any        | Voting  |
| Rewards           | ADD_REWARD_ROLE          | Create a new reward | Voting        | Voting  |


### Core Apps

| App               | Permission            | Grantee | Manager |
| ----------------- | --------------------- | ------- | ------- |
| Voting            | CREATE_VOTES          | Tokens  | Voting  |
| Voting            | ROLE_MODIFY_QUORUM         | Voting  | Voting  |
| Voting            | MODIFY_SUPPORT        | Voting    | Voting  |
| Vault             | TRANSFER              | Finance | Voting  |
| Vault             | TRANSFER              | Projects | Voting  |
| Vault             | TRANSFER              | Rewards | Voting  |
| Vault             | TRANSFER              | Allocations | Voting  |
| Finance           | CREATE_PAYMENTS       | Voting  | Voting  |
| Finance           | EXECUTE_PAYMENTS      | Voting  | Voting  |
| Finance           | DISABLE_PAYMENTS      | Voting  | Voting  |
| Tokens     | MINT                | Voting  | Voting  |
| Tokens     | BURN      | Voting  | Voting  |
| Kernel            | APP_MANAGER           | Voting  | Voting  |
| ACL               | CREATE_PERMISSIONS    | Voting  | Voting  |
| EVMScriptRegistry | REGISTRY_ADD_EXECUTOR | Voting  | Voting  |
| EVMScriptRegistry | REGISTRY_MANAGER      | Voting  | Voting  |
