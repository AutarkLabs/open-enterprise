module.exports = web3 => async () => {
    await web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_mine',
    })
}
