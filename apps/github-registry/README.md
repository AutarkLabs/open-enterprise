# Aragon React Kit Boilerplate

> 🕵️ [Find more boilerplates using GitHub](https://github.com/search?q=topic:aragon-boilerplate) | 
> ✨ [Official boilerplates](https://github.com/search?q=topic:aragon-boilerplate+org:aragon)

React boilerplate for Aragon applications.

This boilerplate also includes a fully working example app, complete with a background worker and a front-end in React (with Aragon UI).

## Usage

Kit support requires using the Aragon CLI with a version greater than 4.1.0.
```sh
npm install -g @aragon/cli
aragon init app aragon/aragon-react-kit-boilerplate
```

## Make the kit work with your app

- In order for the kit to work properly, it needs to know what the name of your app is. Replace `app` in [this line](https://github.com/aragon/aragon-react-kit-boilerplate/blob/dd7d571da4ab1ee6a0a82130b0c2c5d6218771b6/contracts/Kit.sol#L58) with the name of your app in the `arapp.json` file (e.g. `myapp` for `myapp.aragonpm.eth`)

- Edit the roles defined in the kit to configure your DAO as you want!

## Run the kit

```sh
aragon run --kit Kit --kit-init @ARAGON_ENS
```

## What's in the box?

### npm Scripts

- **start**: Run the app locally
- **compile**: Compile the smart contracts
- **build**: Compiles the contracts and builds the front-end
- **test**: Runs tests for the contracts
- **publish**: Builds the apps and the contracts and publishes them to IPFS and APM

### Libraries

- [**@aragon/os**](https://github.com/aragon/aragonos): Aragon interfaces
- [**@aragon/client**](https://github.com/aragon/aragon.js/tree/master/packages/aragon-client): Wrapper for Aragon application RPC
- [**@aragon/ui**](https://github.com/aragon/aragon-ui): Aragon UI components (in React)
