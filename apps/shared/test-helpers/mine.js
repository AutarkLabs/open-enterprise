const mineBlock = require("./mineBlock")
const getBlock = require("./blockNumber")

const getWeb3 = () => {
    const Web3 = require("web3");
    const PrivateKeyProvider = require("truffle-privatekey-provider");
    const provider = new PrivateKeyProvider(
        "A8A54B2D8197BC0B19BB8A084031BE71835580A01E70A45A13BABD16C9BC1563",
        "http://localhost:8545"
    );
    return new Web3(provider);
}

// truffle script: can be run with `truffle exec`
const mine = async (cb) => {
    const root = this
    let activeWeb3
    let argIdx
    if (typeof cb !== 'function') {
        activeWeb3 = getWeb3()
        argIdx = 2
    } else {
        activeWeb3 = web3
        argIdx = 4
    }
    const mineBlockFn = mineBlock(activeWeb3)
    const getBlockFn = getBlock(activeWeb3)

    const mineBlocks = async (blocks) => {
        const blockArr = new Array(Number(blocks)).fill(0)
        blockArr.forEach(async () => {
            try {
                await mineBlockFn()
            }
            catch(e) {
                console.error('error: ',e)
            }
        })
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
    }
    if (!Number(process.argv[argIdx])) {
        await mineToBlock(process.argv[argIdx + 1])
    }
    else {
        await mineBlocks(process.argv[argIdx])
    }

    console.log('\nblock',await getBlockFn(), 'mined')

    if (typeof cb === 'function') {
        cb()
    } else {
        process.exit()
    }
}

module.exports = mine
if (!process.argv[1].includes('truffle')) {
    mine()
}
