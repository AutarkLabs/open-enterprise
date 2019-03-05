const {
  ACL,
  DAOFactory,
  EVMScriptRegistryFactory,
  Kernel,
  MiniMeToken
} = require('@tps/test-helpers/artifacts')

const Rewards = artifacts.require('RewardsCore')
const Vault = artifacts.require('Vault')
const { assertRevert } = require('@tps/test-helpers/assertThrow')
const { encodeCallScript } = require('@tps/test-helpers/evmScript')
const mineBlock = require('@tps/test-helpers/mineBlock')(web3)

const ANY_ADDR = '0xffffffffffffffffffffffffffffffffffffffff'
const NULL_ADDRESS = '0x00'

const rewardAdded = receipt =>
  receipt.logs.filter(x => x.event == 'RewardAdded')[0].args.rewardId

const rewardClaimed = receipt =>
  receipt.logs.filter(x => x.event == 'RewardClaimed')[0].args.rewardId

contract('Rewards App', accounts => {
  let daoFact,
    app = {},
    vaultBase,
    vault,
    referenceToken,
    rewardToken


  const root = accounts[0]
  const contributor1 = accounts[1]
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
      ANY_ADDR,
      app.address,
      await app.ADD_REWARD_ROLE(),
      root,
      { from: root }
    )


    vaultBase = await Vault.new()
    const receipt1 = await dao.newAppInstance('0x5678', vaultBase.address, '0x', false, { from: root })
    vault = Vault.at(receipt1.logs.filter(l => l.event == 'NewAppProxy')[0].args.proxy)
    await vault.initialize()
    await acl.createPermission(
      ANY_ADDR,
      vault.address,
      await vault.TRANSFER_ROLE(),
      root,
      { from: root }
    )
    await app.initialize(vault.address)

    referenceToken = await MiniMeToken.new(NULL_ADDRESS, NULL_ADDRESS, 0, 'one', 18, 'one', true) // empty parameters minime
    rewardToken = await MiniMeToken.new(NULL_ADDRESS, NULL_ADDRESS, 0, 'two', 18, 'two', true) // empty parameters minime

    await referenceToken.generateTokens(root, 1e18)

    await referenceToken.generateTokens(contributor1, 1e18)
    await referenceToken.generateTokens(contributor2, 1e18)
    await referenceToken.generateTokens(contributor3, 1e18)

    await rewardToken.generateTokens(root, 25e18)
    await rewardToken.transfer(vault.address, 25e18)
    await mineBlock()

  })

  it('receives rewards dividends', async () => {
    let rewardId = rewardAdded(
      await app.newReward(
        false,
        referenceToken.address,
        rewardToken.address,
        4e18,
        1,
        1,
        0
      )
    )
    await mineBlock()
    await mineBlock()
    await app.claimReward(rewardId)
    const reward = await rewardToken.balanceOf(root)
    assert(reward == 1e18, 'reward should be 1e18 or 1eth equivalant')
  })

  it('receives rewards merit', async () => {
    await referenceToken.generateTokens(root, 30e18)
    let rewardId = rewardAdded(
      await app.newReward(
        true,
        referenceToken.address,
        rewardToken.address,
        4e18,
        4,
        1,
        0
      )
    )
    await referenceToken.generateTokens(root, 1e18)
    await referenceToken.generateTokens(contributor1, 1e18)
    await referenceToken.generateTokens(contributor2, 1e18)
    await referenceToken.generateTokens(contributor3, 1e18)
    await mineBlock()
    await mineBlock()
    await app.claimReward(rewardId)
    const reward = await rewardToken.balanceOf(root)
    assert(reward == 1e18, 'reward should be 1e18 or 1eth equivalant')
  })


})
