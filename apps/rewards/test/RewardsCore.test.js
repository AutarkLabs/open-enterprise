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


    vaultBase = await Vault.new()
    const receipt1 = await dao.newAppInstance('0x5678', vaultBase.address, '0x', false, { from: root })
    vault = Vault.at(receipt1.logs.filter(l => l.event == 'NewAppProxy')[0].args.proxy)
    await vault.initialize()
    await acl.createPermission(
      app.address,
      vault.address,
      await vault.TRANSFER_ROLE(),
      root,
      { from: root }
    )
    await app.initialize(vault.address)

    referenceToken = await MiniMeToken.new(NULL_ADDRESS, NULL_ADDRESS, 0, 'one', 18, 'one', true) // empty parameters minime
    rewardToken = await MiniMeToken.new(NULL_ADDRESS, NULL_ADDRESS, 0, 'two', 18, 'two', true) // empty parameters minime
  })

  context('Basic contract functions', () => {
    before(async () => {
      await referenceToken.generateTokens(root, 1e18)
      await referenceToken.generateTokens(contributor1, 1e18)
      await referenceToken.generateTokens(contributor2, 1e18)
      await referenceToken.generateTokens(contributor3, 1e18)

      await rewardToken.generateTokens(root, 25e18)
      await rewardToken.transfer(vault.address, 25e18)
    })

    let dividendRewardId, meritRewardId, rewardInformation
    it('creates a dividend reward', async () => {
      dividendRewardId = rewardAdded(
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
      assert(dividendRewardId == 0, 'first reward should be id 0')
    })

    it('creates a merit reward', async () => {
      meritRewardId = rewardAdded(
        await app.newReward(
          true,
          referenceToken.address,
          rewardToken.address,
          4e18,
          5,
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
      assert(meritRewardId == 1, 'second reward should be id 1')
    })

    it('gets information on the dividend reward', async () => {
      rewardInformation = await app.getReward(dividendRewardId)
      assert(rewardInformation[0] ===false, 'First reward should be dividend')
    })

    it('gets information on the merit reward', async () => {
      rewardInformation = await app.getReward(meritRewardId)
      assert(rewardInformation[0] === true, 'Second reward should be merit')
    })

    it('receives rewards dividends', async () => {
      await app.claimReward(dividendRewardId)
      const balance = await rewardToken.balanceOf(root)
      assert(balance == 1e18, 'reward should be 1e18 or 1eth equivalant')
    })

    it('receives rewards merit', async () => {
      await app.claimReward(meritRewardId)
      const balance = await rewardToken.balanceOf(root)
      assert(balance == 2e18, 'reward should be 2e18 or 2eth equivalant; 1 for each reward')
    })

  })

  context('Check require statements', () => {

    it('fails to create reward without permission', async() => {
      assertRevert(
        app.newReward(
          false,
          referenceToken.address,
          rewardToken.address,
          4e18,
          1,
          1,
          0, {from: contributor1}
        )
      )
    })


    it('fails to create reward with invalid reference token', async() => {
      assertRevert(
        app.newReward(
          false,
          0xdeadbeef,
          rewardToken.address,
          4e18,
          1,
          1,
          0
        )
      )
    })

    xit('fails to create reward with invalid reward token', async() => {
      assertRevert(
        app.newReward(
          false,
          referenceToken.address,
          root,
          4e18,
          1,
          1,
          0
        )
      )
    })

    it('fails to create merit reward multiple occurances', async() => {
      assertRevert(
        app.newReward(
          true,
          referenceToken.address,
          rewardToken.address,
          4e18,
          1,
          4,
          0
        )
      )
    })

    it('fails to create dividend reward too many occurances', async() => {
      assertRevert(
        app.newReward(
          false,
          referenceToken.address,
          rewardToken.address,
          4e18,
          4,
          43,
          0
        )
      )
    })

    it('fails to payout a merit reward with no token changes', async() => {
      const meritRewardId = rewardAdded(
        await app.newReward(
          true,
          referenceToken.address,
          rewardToken.address,
          4e18,
          5,
          1,
          0
        )
      )
      assertRevert(
        app.claimReward(meritRewardId)
      )
    })

    it('fails to payout a merit reward with no token changes for the user', async() => {
      const meritRewardId = rewardAdded(
        await app.newReward(
          true,
          referenceToken.address,
          rewardToken.address,
          4e18,
          2,
          1,
          0
        )
      )
      await referenceToken.generateTokens(contributor1, 1e18)
      await referenceToken.generateTokens(contributor2, 1e18)

      assertRevert(
        app.claimReward(meritRewardId)
      )
    })
  })

})
