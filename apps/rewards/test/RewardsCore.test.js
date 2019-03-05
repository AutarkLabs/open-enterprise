const {
  ACL,
  DAOFactory,
  Vault,
  Kernel,
  MiniMeToken
} = require('@tps/test-helpers/artifacts')

const Rewards = artifacts.require('RewardsCore')

const { assertRevert } = require('@tps/test-helpers/assertThrow')
const { encodeCallScript } = require('@tps/test-helpers/evmScript')
const timeTravel = require('@tps/test-helpers/timeTravel')(web3)

const ANY_ADDR = '0xffffffffffffffffffffffffffffffffffffffff'
const NULL_ADDRESS = '0x00'

const rewardAdded = receipt =>
  receipt.logs.filter(x => x.event == 'RewardAdded')[0].args.rewardId

const rewardClaimed = receipt =>
  receipt.logs.filter(x => x.event == 'RewardClaimed')[0].args.rewardId

contract('Rewards App', accounts => {
  let daoFact,
    app = {},
    token

  const root = accounts[0]
  const contributor1 = accounts[0]
  const contributor2 = accounts[2]
  const contributor3 = accounts[3]

  before(async () => {
    //Create Base DAO Contracts
    const kernelBase = await Kernel.new(true)
    const aclBase = await ACL.new()
    const regFact = await EVMScriptRegistryFactory.new()
    daoFact = await DAOFactory.new(
      kernelBase.address,
      aclBase.address,
      regFact.address
    )
    referenceToken = await MiniMeToken.new(n, n, 0, 'n', 0, 'n', true) // empty parameters minime
    rewardToken = await MiniMeToken.new(n, n, 0, 'n', 0, 'n', true) // empty parameters minime
  })

  beforeEach(async () => {
    const r = await daoFact.newDAO(root)
    const dao = Kernel.at(
      r.logs.filter(l => l.event == 'DeployDAO')[0].args.dao
    )

    const acl = ACL.at(await dao.acl())

    await acl.createPermission(
      root,
      dao.address,
      await dao.APP_MANAGER_ROLE(),
      root,
      { from: root }
    )

    // TODO: Revert to only use 2 params when truffle is updated
    // read: https://github.com/AutarkLabs/planning-suite/pull/243
    const receipt = await dao.newAppInstance(
      '0x1234',
      (await Rewards.new()).address,
      0x0,
      false,
      { from: root }
    )

    app = Rewards.at(
      receipt.logs.filter(l => l.event === 'NewAppProxy')[0].args.proxy
    )

    // create ACL permissions
    await acl.createPermission(
      root,
      app.address,
      await app.ADD_REWARD_ROLE(),
      root,
      { from: root }
    )


    vault = await Vault.new()

    await acl.createPermission(
      app.address,
      vault.address,
      await vault.TRANSFER_ROLE(),
      root,
      { from: root }
    )

    await referenceToken.mint(vault, 50e18)
    await rewardToken.mint(vault, 25e18)

  })

  it('receives rewards', async () => {
    await token.addReward({from: root, value: web3.toWei(1, 'ether')})

  })

})
