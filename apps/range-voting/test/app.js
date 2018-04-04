const RangeVoting = artifacts.require('./RangeVoting.sol')

contract('RangeVoting', (accounts) => {
  it('can initialize', async () => {
    let app = await RangeVoting.new();
  })
})
