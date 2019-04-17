# Staging Deployments

## AddressBook

### 8.0.0

```sh
✔ Successfully published address-book-staging.open.aragonpm.eth v8.0.0:
ℹ Contract address: 0x045b5A4032F4Ba4b1044c7ed670682326D416476
ℹ Content (ipfs): QmWj3bo9agtagAjgdoVeYxfXabviSbuWpSqdxbpkMxWCa7
ℹ Transaction hash: 0x0b4bef766abb49543810a242902fe9cea3d534184f8001ade47f341559982c2b
```

- command: `./node_modules/.bin/lerna exec --scope="@tps/apps-address-book" --stream aragon apm publish major -- --files dist/ --environment staging`

### 6.0.2

```sh
 ✔ Successfully published address-book-staging.open.aragonpm.eth v6.0.2:
 ℹ Contract address: 0x83A80A139d1b739E856e1daee9AF5aBBE93FB823
 ℹ Content (ipfs): QmQ7AMCsG4THGiesXd7g5s465gFwJoSQjNe8p8szyJUMS7
 ℹ Transaction hash: 0xa290a14d9172c2e6949c9932e29c680abef67c2a104152b6519cb5100dab7d71
```

- command: `aragon apm publish patch --files dist/ --environment staging`
- files hashes:

```sh

```

## Allocations

### 1.0.3

```sh
✔ Successfully published allocations-staging.open.aragonpm.eth v1.0.3:
ℹ Contract address: 0x234C9b8CaC35565f7ff2Eac84A1ED3bdc8EBf4d7
ℹ Content (ipfs): QmRgtnsr4LPmqwAvF2NMgyDTcYfU6HmR5wqAbgVzk6MJyL
ℹ Transaction hash: 0xfbc36651ca39a8a1d12143c9a9a6a528d64a8d7e8da970935e4c0900152a8e77
```

- command: `aragon apm publish patch --files dist/ --environment staging`
- files hashes:

```sh

```

## Projects

### 2.0.0

```sh
 ✔ Successfully published projects-staging.open.aragonpm.eth v2.0.0:
 ℹ Contract address: 0x041B3931Edbb1f1a282656d8547eBf79A8ccC187
 ℹ Content (ipfs): QmVXVSN8pTut2rhvKsH9R7KwNAptEXCWHKw7firPy7dLFY
 ℹ Transaction hash: 0xcc7995c7607d01c2aeeef3b58f433e69a7c2f6b9402bc5e4c8c6395c5f2de0a8
```

### 1.0.4

```sh
 ✔ Successfully published projects-staging.open.aragonpm.eth v1.0.4:
 ℹ Contract address: 0xd20D9907AfC2CfbdeC83Cc75E248e7FFa1f56C2A
 ℹ Content (ipfs): Qmczv4WCprFtBiTcXq3U9mUTzjec3CPvBM5FCzvW9aLTbr
 ℹ Transaction hash: 0x03295cf88eb2cb9fcbaef99192658010f99bde52853cad62ba4f683121c22a38
```

- command: `aragon apm publish patch --files dist/ --environment staging`
- commit: [674f0c9](https://github.com/AutarkLabs/planning-suite/commit/674f0c9db6ae89ef9aa6686b28963eb048f0fb1f)

### 1.0.3

```sh
 ✔ Successfully published projects-staging.open.aragonpm.eth v1.0.3:
 ℹ Contract address: 0xd20D9907AfC2CfbdeC83Cc75E248e7FFa1f56C2A
 ℹ Content (ipfs): QmdDXSpGwvVi163QFiE41zU8V9iPAXQxuDTCZezfWFNABe
 ℹ Transaction hash: 0x2e686b91682a996427809d9ed356fbe3a092247344e7001386f19bdc8964a026
```

- command: `aragon apm publish patch --files dist/ --environment staging`
- commit: [b5a5dd0](https://github.com/AutarkLabs/planning-suite/commit/b5a5dd0685e0a66e8124c9901e4f1f6249ed0d11)

## DotVoting (formerly RangeVoting)

### 1.0.0

```sh
✔ Successfully published dot-voting-staging.open.aragonpm.eth v1.0.0:
ℹ Contract address: 0xAf1cE8DEB90bba9C2C5C077cdfbd6eD67d824F96
ℹ Content (ipfs): QmQsWpUkrLV8QMkLhHtZkUV9joCJfwfS1S695cMS2NCCyT
ℹ Transaction hash: 0xc361863e7ccdde3d6d04d26494ba276d863b1025cebfea15b345c95a1fab7cbe
```

- command: `./node_modules/.bin/lerna exec --scope="@tps/apps-address-book" --stream aragon apm publish major -- --files dist/ --environment staging`

---

### Range-Voting 1.0.3

```sh
 ✔ Successfully published range-voting-staging.open.aragonpm.eth v1.0.3:
 ℹ Contract address: 0x78BE5da6223Eb1834EFe47ad0ACe42132D0b5494
 ℹ Content (ipfs): QmeGWAqDUSQcYGdeb7cg6A4PURaRMBPjFJv6oY4iReYoBm
 ℹ Transaction hash: 0x7e9965d351fa4446d8983b089b644f6b981b40c8fe073a74c2fcac7e8bde2d7f
```

- command: `aragon apm publish patch --files dist/ --environment staging`
- files hashes:

```sh


```

Planning-Suite Template (kit)

@tps/kits-planning-suite: ✔ Successfully published planning-suite-staging.open.aragonpm.eth v2.0.0:
@tps/kits-planning-suite: ℹ Contract address: 0x3FA2934a61c1DcC080dA2a0535a678c3A5d070aD
@tps/kits-planning-suite: ℹ Content (ipfs): QmQFm8NmWYDJMkU3nM1HMFoQeLfoBU4ah3898SyyQNczAB
@tps/kits-planning-suite: ℹ Transaction hash: 0x3073d4685701245cb1a9f2693afbe786f7f3e93fe118981c03815bdc7f8503fc

- command: `./node_modules/.bin/lerna exec --scope="@tps/kits-*" --stream ENS=0x98Df287B6C145399Aaa709692c8D308357bC085D aragon apm publish major 0x3fa2934a61c1dcc080da2a0535a678c3a5d070ad -- --environment staging`
