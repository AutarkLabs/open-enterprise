# Range voting

## Workflow
For fast frontend development without aragon backend:

`npm run dev`

For testing everything in relation to each other you first need to delete the `dist` folder from `.gitignore` and then run the following each time you make a change:

`npm run start`

You can run each of following commands in each terminal tab:
`npm run devchain`
`npm run test`

### Libraries

- [**@aragon/core**](https://github.com/aragon/aragon-core): Aragon interfaces
- [**@aragon/client**](https://github.com/aragon/aragon.js/tree/master/packages/aragon-client): Wrapper for Aragon application RPC
- [**@aragon/ui**](https://github.com/aragon/aragon-ui): Aragon UI components (in React)
