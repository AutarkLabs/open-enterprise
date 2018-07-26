# Development Notes

## Monorepo info

```bash
$ lerna ls
lerna info version 2.11.0
lerna info versioning independent
@tpt/planning-app      v0.0.1
@tpt/apps-range-voting v0.0.1
```

- Planning-app is the base monorepo.
- Frontend packages where merged with individual aragon apps, it added complexity and was not needed.
- Aragon/cli should be used to bump package versions with `apm version` (more info in Aragon hack documentation). It needs to have a devhchain running.

## Recommended instructions

### Before doing anything run the install script to avoid dependency errors:

- `npm i` : Installs root project dependencies and then bootstraps all independent app dependencies.

**It installs everthying needed, since commands are run with `npx` it is not necessary to have global requirements apart from Node.js LTS or greater**

### Then, run one of the handy scripts depending of the needs:

#### To start frontend development:

- `npm run dev:<app_name>`

  - where `<app_name>` can be one of:
    - `address` for Address Book App (`npm run dev:address`)
    - `github` for Github Registry App (`npm run dev:github`)
    - `payout` for Payout Engine App (`npm run dev:payout`)
    - `range` for Range Voting App (`npm run dev:range`)

#### To start blockchain, smart contract or Aragon os development:

- `npm run start:<app_name>`

  - where `<app_name>` can be one of:
    - `address` for Address Book App (`npm run start:address`)
    - `github` for Github Registry App (`npm run start:github`)
    - `payout` for Payout Engine App (`npm run start:payout`)
    - `range` for Range Voting App (`npm run start:range`)

#### To run everything working together in the Aragon Wrapper:

- `npm start`

This script checks/install dependencies through lerna bootstrap, then concurrently starts a local development blockchain to deploy the individual apps there calling apm publish on each app, also with help of lerna.
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
- If previous steps where succesful, then run: `npx aragon run --kit PlanningKit --kit-init @ARAGON_ENS`
  To deploy the kit and launch the Aragon Wrapper in the browser.
  It needs the same local blockchain to find the locally deployed apps, so better to keep the devchain open and running (Again, with `npm start` is not needed (but allowed) because is launched in parallel with concurrently).

- `npm run clean`
  Just if the other steps don't work call this and start over with a clean state, maybe combined with `rm -rf ~/.ipfs ~/.aragon` to delete the local machine state (this does not delete any key, just local data that then will be downloaded again).

#### Complete npm script list:

| Command                  | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `npm run bootstrap`      | Bootstrap the full project deps                |
| `npm run clean`          | Delete temp git state (build and dep folders)  |
| `npm run dev:address`    | Start Address Book app frontend development    |
| `npm run dev:github`     | Start Github Registry app frontend development |
| `npm run dev:payout`     | Start Payout Engine app frontend development   |
| `npm run dev:range`      | Start Range Voting app frontend development    |
| `npm run devchain`       | Start a local development blockchain           |
| `npm run devchain:reset` | Reset local blockchain and start new one       |
| `npm i` or `npm install` | Launch the bootstrap script                    |
| `npm run publish:apps`   | Deploy all apps to local ipfs apm              |
| `npm run start`          | Start the full planning app with DAO kit       |
| `npm run start:kit`      | Deploy and start the DAO Kit with everything   |
