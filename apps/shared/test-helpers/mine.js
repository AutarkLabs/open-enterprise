/// uncomment the Below block to use on aragon devchain without truffle

//const Web3 = require("web3");
//const PrivateKeyProvider = require("truffle-privatekey-provider");
//const provider = new PrivateKeyProvider(
//    "A8A54B2D8197BC0B19BB8A084031BE71835580A01E70A45A13BABD16C9BC1563",
//    "http://localhost:8545"
//  );
//const web3 = new Web3(provider);

const mineBlock = require("./mineBlock")
const getBlock = require("./blockNumber")

module.exports = async (cb) => {
    const mineBlockFn = mineBlock(web3)
    const getBlockFn = getBlock(web3)

    const mineBlocks = async (blocks) => {
        for (var i = 0; i < blocks; i++) {
            try {
                await mineBlockFn()
            }
            catch(e) {
                console.error('error: ',e)
            }
        }
        console.log('\nblock',await getBlockFn(), 'mined')
    }

    const mineToBlock = async (blockNumber) => {
        while (blockNumber > await getBlockFn()) {
            try {
                await mineBlockFn()
            }
            catch(e) {
                console.error('error: ',e)
            }
        }
        console.log('\nblock',await getBlockFn(), 'mined')
    }

    if (!Number(process.argv[4])) {
        await mineToBlock(process.argv[5])
    }
    else {
        await mineBlocks(process.argv[4])
    }
    cb()
}
