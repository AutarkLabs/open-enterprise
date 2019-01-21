# That Planning Suite deployment instructions

## Prerrequisites

## Apps deployment

### Configure deployment key

```json
Using a different Ethereum account
To deploy from a different account, you can:

define a ~/.aragon/mnemonic.json file
{
    "mnemonic": "explain tackle mirror kit ..."
}
or
define a ~/.aragon/${network_name}_key.json file, for example: ~/.aragon/rinkeby_key.json
{
    "keys": [
        "a8a54b2d8197bc0b19bb8a084031be71835580a01e70a45a13babd16c9bc1563"
    ]
}
```

### Configure deployment provider

### Deploy apps Programatically

### Deploy apps Manually

## Installing deployed apps into a DAO

### Previously created DAO

#### Add the apps to the DAO

#### Manually creating a permission

### New DAO created from the template kit

## Pitfalls and common problems

## Using dedicated IPFS node

## IPFS propagation tips

In your terminal run the following command to spin up your IPFS node and broadcast your files
`ipfs daemon --enable-namesys-pubsub`

Then request your hash at the following gateways, the Aragon one last, to double check it has propagated:

* http://ipfs.io/ipfs/
* http://ipfs.infura.io/ipfs/
* https://ipfs.eth.aragon.network/ipfs/

Check this list if you want other gateways - https://discuss.ipfs.io/t/curated-list-of-ipfs-gateways/620
