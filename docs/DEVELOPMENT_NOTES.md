# Development Notes

## Monorepo info

```bash
$ lerna ls
lerna info version 2.11.0
lerna info versioning independent
@autarklabs/planning-suite      v0.0.1
@autarklabs/apps-address-book v0.0.1
@autarklabs/apps-allocations   v0.0.1
@autarklabs/apps-projects     v0.0.1
@autarklabs/apps-dot-voting v0.0.1
```

- Planning-suite is the base monorepo.
- Frontend packages were merged with individual aragon apps, it added complexity and was not needed.
- Aragon/cli should be used to bump package versions with `aragon apm publish` (more info in Aragon hack documentation). It needs to have a devchain running.

## Recommended instructions

### Before doing anything, run the install script to avoid dependency errors

- `npm i` : Installs root project dependencies and then bootstraps all independent app dependencies.

### Then, run one of the handy scripts depending on your needs

#### To run everything working together in the Aragon Wrapper with a Development Blockchain

- `npm run start:dev`

This script checks/install dependencies through lerna bootstrap, then concurrently starts a local development blockchain to deploy the individual apps there calling `aragon apm publish` on each app, also with help of lerna.
When individual apps are deployed, the aragon/cli --kit option compiles and deploys the PlanningKit dao template sitting in contracts folder.

This folder contains also a PlanningDummy smart contract. This is needed to conform the minimal requirements to be an Aragon App, call it bare, skeleton, minimal. This smart contract is actually never deployed nor called from any other contract.

The PlanningKit smart contract takes care of installing individual apps along with native Aragon official apps, and also setting the roles and permissions.

Finally, the script launches the Aragon Wrapper with the complete planning suite. In this
environment javascript files can be updated and saved. Each save will trigger a hot-reload in the
browser.

#### To run everything together inside the wrapper with web files and assets served via IPFS

- `npm run start`

This is the same as above, only all javascript files are published via IPFS.
This more closely emulates a production environment, but any frontend or worker script changes will
require a republish to view changes in the browser.

### After doing your work, run the linter and the tests

- `npm run lint`
- `npm run test`

## Troubleshooting

### Publishing and Dev environment

- If something stops working because, you know, things break, the right way to debug the problem is to run the same `npm run start:dev` steps one by one:
- `npm run bootstrap`
  Check if some dependency is not installed or available
- `npm run publish:apps`
  To debug if the individual apps are being published, if more control is needed, individual app publishing can be called by `cd apps/app_folder && npm run publish`. Any build-time errors should display in the bash console during this stage
- `npm run devchain or npm run devchain:reset`
  Can be run in another terminal window to be able to deploy all apps together. `npm start` script does this by calling this concurrently.
- If previous steps where successful, then run: `aragon run --kit PlanningKit --kit-init @ARAGON_ENS`
  To deploy the kit and launch the Aragon Wrapper in the browser.
  It needs the same local blockchain to find the locally deployed apps, so better to keep the devchain open and running (Again, with `npm start` this step is not needed (but allowed) because is launched concurrently).

- `npm run clean`
  Just if the other steps don't work call this and start over with a clean state, maybe combined with `npm run clean:aragon` to delete the local machine state (this does not delete any key, just local data that then will be downloaded again).

> **Tip** to completely reset your environment run `npm run clean && npm run clean:aragon` and then reinstall with `npm i`

- `npm run build:script:<app_name>` These commands are used to republish the webworker scripts while
  running the `npm run start:dev`environment. These changes are only applied after clearing the DAO's cache in DAO Settings. A page refresh alone will not suffice.

  - where `<app_name>` can be one of:
    - `address` for Address Book App (`npm run build:script:address`)
    - `projects` for Projects App (`npm run build:script:projects`)
    - `allocations` for Allocations App (`npm run build:script:allocations`)
    - `dot` for Dot Voting App (`npm run build:script:dot`)
    - `rewards` for Rewards App (`npm run build:script:rewards`)

- There are now two kits: a `deploy kit` and a `dev kit`. The `deploy kit` exists in the root-level kits folder and isn't of much help with development, while the `dev kit` resides in the root-level apps folder. All of the above commands run out of the `dev kit`.

### Invalid Arg Type
If you get a

    TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received type object
    
, install Aragon CLI globally with `npm i -g @aragon/cli@5.6.2`.

### Backend

Contract testing is run by executing `npm run test:<app_name>`. To run all contract tests just execute `npm run test`.

### Frontend

- As mentioned above, frontend apps rebuild on save when running `npm run start:dev`, with the exception of the webworker scripts, which can be manually rebuilt as described above. These scripts
translate smart contract events into app state. For more information about them, see [here](https://hack.aragon.org/docs/aragonjs-guide-bg-scripts).

- The `web3` object is not available within the app context. If you need access to the utils library, import standalone functions from `web3-utils` into the files you need them.

- Network-dependent web3 methods that can be used in aragon apps are listed [here](https://github.com/aragon/aragon.js/blob/0e1fa77ca34ff8b6322b0d5c93320899617ae9dd/packages/aragon-wrapper/src/rpc/handlers/web3-eth.js).

- Perhaps confusingly, an app's contract-generated state is accessible via `props` in the root App.js file. This is because the aragon wrapper passes the app state generated by the script.js file in via the [Window.postMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage). You don't need to know about the postMessage api to build aragon apps since it's abstracted away for us. Any state generated within the App.js file itself is accessible via state as expected. This is why a hot-reloaded app might need to be exited and re-entered sometimes, because the passed-in state can be deleted when the app iframe refreshes on save.



### Incomplete npm script list

| Command                   | Description                                   |
| ------------------------- | --------------------------------------------- |
| `npm run bootstrap`       | Bootstrap the full project deps               |
| `npm run clean`           | Delete temp git state (build and dep folders) |
| `npm run dev:address`     | Start Address Book app frontend development   |
| `npm run dev:projects`    | Start Projects app frontend development       |
| `npm run dev:allocations` | Start Allocations app frontend development    |
| `npm run dev:dot`         | Start Dot Voting app frontend development     |
| `npm run devchain`        | Start a local development blockchain          |
| `npm run devchain:reset`  | Reset local blockchain and start new one      |
| `npm i` or `npm install`  | Launch the bootstrap script                   |
| `npm run publish:apps`    | Deploy all apps to local ipfs apm             |
| `npm run start`           | Start the full planning suite with DAO kit    |
| `npm run start:kit`       | Deploy and start the DAO Kit with everything  |

#### Apps Loading Bug (Is actually a Metamask issue)

- If Aragon Wrapper seems to be stuck loading the apps in the browser, what is known to be a solution is to change metamask provider, by switching the networks, to rinkeby, for example, and then switching to local rpc again, then refreshing the page, and Apps will load now.
- The reason for this is that Metamask is not correctly updating the blockchain state from aragon devchain between the normal restarts and resets that happen in development.

#### Wrong fonts, colors or browser console errors

> **Tip** Look at letter "g" to quickly know if aragon fonts were loaded and applied

- Aragon puts all the files in the app in the ipfs folder, so files must be correctly built to the dist folder, this happens in all single apps.
- Aragon provides the command `copy-aragon-ui-assets` and we use `npm run sync-assets` to call it. The problem is that is easy to have errors configuring the path in AragonApp component (from @aragon/ui), because is not documented where the slashes go or things like that, even some original Aragon apps have or had this error.
- To inspect ipfs files for errors deploying, load ipfs ui: <http://localhost:5001/webui> while the Aragon Wrapper is running, and paste the ipfs hash from the app into the files tab to load its content.

#### Additional info

- The old deployment code that seemed to do the kit and aragon apps deployments with javascript was replaced by the handy Kit smart contract, but here is kept for historical purposes: [**bare/migrations/2_deploy.js**](https://github.com/AutarkLabs/planning-suite/blob/bfb0900b6c15d91bc1d0d9967c6f5c46c3b9dd27/wip-apps/bare/migrations/2_deploy.js)
