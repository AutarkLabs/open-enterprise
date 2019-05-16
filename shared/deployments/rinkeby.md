# Staging Deployments

## AddressBook

```sh
✔ Successfully published tps-address-book.open.aragonpm.eth v1.0.2:
ℹ Contract address: 0x9B19faC634e58aEBa3F45D90D4f08EAF888693e3
ℹ Content (ipfs): Qmbsmpb7L8jjXfXbv8fzDbfEd6Yf1pEUAu6QWHCHFeEVKY
ℹ Transaction hash: 0xec6ce449e87c9d78afd845ef8d29af087662d09443b21efca93989a5098e8ec4
```

## Allocations

```sh
✔ Successfully published tps-allocations.open.aragonpm.eth v1.0.1: 
ℹ Contract address: 0x2f9A75f6e81F8cF3711b482CD56aAC029B6843d1
ℹ Content (ipfs): QmVW23vYVyjTw7b1nG8YrwYVxkMXUPaJDo2VgorNFEipNQ
ℹ Transaction hash: 0x12d6f818b44bf68328d719ae48a8505061685fefa159b36c36a68d60c78abb3d
```

## Projects

### v1.0.3 (current)

```sh
✔ Successfully published tps-projects.open.aragonpm.eth v1.0.3: 
ℹ Contract address: 0x341706591aDE66ea57D02c471e8aAa0C484DE861
ℹ Content (ipfs): QmPxzWikJ4etLLrVZseuesNSwLFgmZFg49hxNNRYuEKtG7
ℹ Transaction hash: 0x50cc90dd6480c8f33480f96fadf8e8025c50323b38b2240eb237c223d02efaa5
```

commit hash: 9890895240b237c1db1271264b2290d002eaf9d6

Command:
`./node_modules/.bin/lerna exec --scope="@tps/apps-projects" --stream aragon apm publish patch -- --files dist/ --environment rinkeby`


### v1.0.2

```sh
✔ Successfully published tps-projects.open.aragonpm.eth v1.0.2: 
ℹ Contract address: 0x341706591aDE66ea57D02c471e8aAa0C484DE861
ℹ Content (ipfs): QmQnAfrMYrWNoQR8HFRKFQZZHMuMz5edPYWDMzQnP9i88Y
ℹ Transaction hash: 0x0756df9c7b8d3f09b4ca6c16ac03d33351c4e214cff1f4100430bd41d203e332
```

Command:
`./node_modules/.bin/lerna exec --scope="@tps/apps-projects" --stream aragon apm publish patch -- --files dist/ --environment rinkeby`


## DotVoting (formerly RangeVoting)
```sh
✔ Successfully published tps-dot-voting.open.aragonpm.eth v1.0.1: 
ℹ Contract address: 0xd191581d372a07d83E8e06Da5a0678b845E638A1
ℹ Content (ipfs): QmUcyfhx2tHs2tepyWAZ9jjSKUSwxVKYHm7GAnYNA7StFw
ℹ Transaction hash: 0x05d61cea5324f9e0424876fbcab4c7778b30d85e9abff6fc8f88cf49de7aecc0
```
## Rewards

```sh
✔ Successfully published tps-rewards.open.aragonpm.eth v1.0.1: 
ℹ Contract address: 0xD22010C362Ac01b6371c0ca3Eebf98e8b586c5B8
ℹ Content (ipfs): QmSovs2sw821JmmT52Se37dbQarbDW6Df8JoyhXwqBbNdY
ℹ Transaction hash: 0x20e7e88081c41f4b07c7ddd0e29a9071747bb9bdd422f56c7a865d939f44ae04
```

## Planning-Suite Template (kit)

```sh
✔ Successfully published tps.open.aragonpm.eth v1.0.0
ℹ Contract address: 0x3Dbe3e16364FAe0A65B203550A9D1619c6C965CF
ℹ Content (ipfs): Qmb1vRAu3nPmPp4LZQ14gd8KVi5sTsWprrWyMqeuNmfByA
ℹ Transaction hash: 0xe140615bb57db729b8dfef8af63600255f97a1574072153451f91b007645bb42
```

- command: `./node_modules/.bin/lerna exec --scope="@tps/kits-*" --stream ENS=0x98Df287B6C145399Aaa709692c8D308357bC085D aragon apm publish major 0x3dbe3e16364fae0a65b203550a9d1619c6c965cf -- --environment rinkeby`
