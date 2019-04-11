const Web3 = require("web3");
const PrivateKeyProvider = require("truffle-privatekey-provider");
const provider = new PrivateKeyProvider(
    "A8A54B2D8197BC0B19BB8A084031BE71835580A01E70A45A13BABD16C9BC1563",
    "http://localhost:8545"
  );
const web3 = new Web3(provider);

const mineBlock = require("./mineBlock")(web3)
const getBlock = require("./blockNumber")(web3)

const mineBlocks = async (blocks) => {
    for (var i = 0; i < blocks; i++) {
        try {
            await mineBlock()
        }
        catch(e) {
            console.error('error: ',e)
        }
    }
    console.log('\nblock',await getBlock(), 'mined')
    process.exit()
}

const mineToBlock = async (blockNumber) => {
    while (blockNumber > await getBlock()) {
        try {
            await mineBlock()
        }
        catch(e) {
            console.error('error: ',e)
        }
    }
    console.log('\nblock',await getBlock(), 'mined')
    process.exit()
}

if (process.argv[3]){
    mineToBlock(process.argv[2])
}
else{
    mineBlocks(process.argv[2])
}
