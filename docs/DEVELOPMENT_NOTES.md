# Development Notes

## Monorepo info

```bash
$ lerna ls
lerna info version 2.11.0
lerna info versioning independent
@tpt/planning-suite      v0.0.1
@tpt/apps-address-book v0.0.1
@tpt/apps-allocations   v0.0.1
@tpt/apps-projects     v0.0.1
@tpt/apps-range-voting v0.0.1
```

- Planning-app is the base monorepo.
- Frontend packages were merged with individual aragon apps, it added complexity and was not needed.
- Aragon/cli should be used to bump package versions with `aragon apm version` (more info in Aragon hack documentation). It needs to have a devhchain running.

## Recommended instructions

### Before doing anything run the install script to avoid dependency errors:

- `npm i` : Installs root project dependencies and then bootstraps all independent app dependencies.

### Then, run one of the handy scripts depending of the needs:

#### To start frontend development:

- `npm run dev:<app_name>`

  - where `<app_name>` can be one of:
    - `address` for Address Book App (`npm run dev:address`)
    - `projects` for Projects App (`npm run dev:projects`)
    - `allocations` for Allocations App (`npm run dev:allocations`)
    - `range` for Range Voting App (`npm run dev:range`)

#### To start blockchain, smart contract or Aragon os development:

- `npm run start:<app_name>`

  - where `<app_name>` can be one of:
    - `address` for Address Book App (`npm run start:address`)
    - `projects` for Projects App (`npm run start:projects`)
    - `allocations` for Allocations App (`npm run start:allocations`)
    - `range` for Range Voting App (`npm run start:range`)

#### To run everything working together in the Aragon Wrapper:

- `npm start`

This script checks/install dependencies through lerna bootstrap, then concurrently starts a local development blockchain to deploy the individual apps there calling `aragon apm publish` on each app, also with help of lerna.
When individual apps are deployed, the aragon/cli --kit option compiles and deploys the PlanningKit dao template sitting in contracts folder.

This folder contains also a PlanningDummy smart contract. This is needed to conform the minimal requirements to be an Aragon App, call it bare, skeleton, minimal. This smart contract is actually never deployed nor called from any other contract.

The PlanningKit smart contract takes care of installing individual apps along with native Aragon official apps, and also setting the roles and permissions.

Finally, the script launches the Aragon Wrapper with the complete planning suite.

## Troubleshooting

- If something stops working because, you know, things break, the right way to debug the problem is to run the same `npm start` steps one by one:
- `npm run bootstrap`
  Check if some dependency is not installed or available
- `npm run publish:apps`
  To debug if the individual apps are being published, if more control is needed, individual app publishing can be called by `cd apps/app_folder && npm run publish`
- `npm run devchain or npm run devchain:reset`
  Is needed to be run in another terminal window to be able to deploy all apps together. `npm start` script does this by using concurrently npm package.
- If previous steps where succesful, then run: `aragon run --kit PlanningKit --kit-init @ARAGON_ENS`
  To deploy the kit and launch the Aragon Wrapper in the browser.
  It needs the same local blockchain to find the locally deployed apps, so better to keep the devchain open and running (Again, with `npm start` is not needed (but allowed) because is launched in parallel with concurrently).

- `npm run clean`
  Just if the other steps don't work call this and start over with a clean state, maybe combined with `rm -rf ~/.ipfs ~/.aragon` to delete the local machine state (this does not delete any key, just local data that then will be downloaded again).

#### Incomplete npm script list:

| Command                   | Description                                   |
| ------------------------- | --------------------------------------------- |
| `npm run bootstrap`       | Bootstrap the full project deps               |
| `npm run clean`           | Delete temp git state (build and dep folders) |
| `npm run dev:address`     | Start Address Book app frontend development   |
| `npm run dev:projects`    | Start Projects app frontend development       |
| `npm run dev:allocations` | Start Allocatioons app frontend development   |
| `npm run dev:range`       | Start Range Voting app frontend development   |
| `npm run devchain`        | Start a local development blockchain          |
| `npm run devchain:reset`  | Reset local blockchain and start new one      |
| `npm i` or `npm install`  | Launch the bootstrap script                   |
| `npm run publish:apps`    | Deploy all apps to local ipfs apm             |
| `npm run start`           | Start the full planning app with DAO kit      |
| `npm run start:kit`       | Deploy and start the DAO Kit with everything  |

#### Apps Loading Bug (Is actually a Metamask issue)

- If Aragon Wrapper seems to be stuck loading the apps in the browser, what is known to be a solution is to change metamask provider, by switching the networks, to rinkeby, for example, and then switching to local rpc again, then refreshing the page, and Apps will load now.
- The reason for this is that Metamask is not correctly updating the blockchain state from aragon devchain between the normal restarts and resets that happen in development.

#### Wrong fonts, colors or browser console errors

_Tip: Look at letter g to quickly know if aragon fonts were loaded and applied_

- Aragon puts all the files in the app in the ipfs folder, so files must be correctly built to the dist folder, this happens in all single apps.
- Aragon provides the command `copy-aragon-ui-assets` and we use `npm run sync-assets` to call it. The problem is that is easy to have errors configuring the path in AragonApp component (from @aragon/ui), because is not documented where the slashes go or things like that, even some original Aragon apps have or had this error.
- The right way to configure AragonApp is like this:

```js
<AragonApp publicUrl="aragon-ui-assets/">You App Here</>
```

So only one slash at the end, otherwise ipfs will probably fail reading asset paths and the app will not show fonts/colors the way it should, it will load the fallback then.

- To inspect ipfs files for errors deploying, load ipfs ui: http://localhost:5001/webui while the Aragon Wrapper is running, and paste the ipfs hash from the app into the files tab to load its content.

#### Additional info

- The old deployment code that seemed to do the kit and aragon apps deployments with javascript was replaced by the handy Kit smart contract, but here is kept for historical purposes: [**bare/migrations/2_deploy.js**](https://github.com/spacedecentral/planning-suite/blob/bfb0900b6c15d91bc1d0d9967c6f5c46c3b9dd27/wip-apps/bare/migrations/2_deploy.js)
