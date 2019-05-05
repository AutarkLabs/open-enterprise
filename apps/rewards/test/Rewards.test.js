const {
  ACL,
  DAOFactory,
  EVMScriptRegistryFactory,
  Kernel,
  MiniMeToken
} = require('@tps/test-helpers/artifacts')

const Rewards = artifacts.require('Rewards')
const Vault = artifacts.require('Vault')
const { assertRevert } = require('@tps/test-helpers/assertThrow')
const { encodeCallScript } = require('@tps/test-helpers/evmScript')
const mineBlock = require('@tps/test-helpers/mineBlock')(web3)
const getBlockNumber = require('@tps/test-helpers/blockNumber')(web3)

const ANY_ADDR = '0xffffffffffffffffffffffffffffffffffffffff'
const NULL_ADDRESS = '0x00'

const rewardAdded = receipt =>
  receipt.logs.filter(x => x.event == 'RewardAdded').map(reward => reward.args.rewardId)

const rewardClaimed = receipt =>
  receipt.logs.filter(x => x.event == 'RewardClaimed')[0].args.rewardId

contract('Rewards App', accounts => {
  let daoFact,
    app = {},
    vaultBase,
    vault,
    referenceToken,
    rewardToken,
    minBlock


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

    referenceToken = await MiniMeToken.new(NULL_ADDRESS, NULL_ADDRESS, 0, 'one', 18, 'one', true) // empty parameters minime
    rewardToken = await MiniMeToken.new(NULL_ADDRESS, NULL_ADDRESS, 0, 'two', 18, 'two', true) // empty parameters minime
    minBlock = await getBlockNumber()
  })

  context('pre-initialization', () => {
    it('will not initialize with invalid vault address', async () =>{
      return assertRevert(async () => {
        await app.initialize(0x0)
      })
    })
  })

  context('successful initialization', () => {
    before(async () => {
      await app.initialize(vault.address)
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
        let blockNumber = await getBlockNumber()
        dividendRewardIds = rewardAdded(
          await app.newReward(
            'testReward',
            false,
            referenceToken.address,
            rewardToken.address,
            4e18,
            blockNumber,
            1,
            2,
            0
          )
        )
        await mineBlock()
        assert(dividendRewardIds[0] == 0, 'first reward should be id 0')
        assert(dividendRewardIds[1] == 1, 'second reward should be id 1')
      })

      it('creates a merit reward', async () => {
        let blockNumber = await getBlockNumber()
        meritRewardIds = rewardAdded(
          await app.newReward(
            'testReward',
            true,
            referenceToken.address,
            rewardToken.address,
            4e18,
            blockNumber,
            6,
            1,
            0
          )
        )
        let meritRewardId = meritRewardIds[0]
        await referenceToken.generateTokens(root, 1e18)
        await referenceToken.generateTokens(contributor1, 1e18)
        await referenceToken.generateTokens(contributor2, 1e18)
        await referenceToken.generateTokens(contributor3, 1e18)
        await mineBlock()
        await mineBlock()
        assert(meritRewardId == 2, 'third reward should be id 2')
      })

      it('gets information on the dividend reward', async () => {
        rewardInformation = await app.getReward(dividendRewardIds[0])
        assert(rewardInformation[1] === false, 'First reward should be dividend')
      })

      it('gets information on the merit reward', async () => {
        rewardInformation = await app.getReward(meritRewardIds[0])
        assert(rewardInformation[1] === true, 'third reward should be merit')
      })

      it('receives rewards dividends', async () => {
        rewardInformation = await app.getReward(dividendRewardIds[0])
        await app.claimReward(dividendRewardIds[0])
        const balance = await rewardToken.balanceOf(root)
        assert(balance == 1e18, 'reward should be 1e18 or 1eth equivalant')
        rewardInformation = await app.getReward(dividendRewardIds[0])
        assert.strictEqual(rewardInformation[10], true, 'reward is claimed')
      })

      it('receives rewards merit', async () => {
        await app.claimReward(meritRewardIds[0])
        const balance = await rewardToken.balanceOf(root)
        assert(balance == 2e18, 'reward should be 2e18 or 2eth equivalant; 1 for each reward')
        rewardInformation = await app.getReward(meritRewardIds[0])
        assert.strictEqual(rewardInformation[10], true, 'reward is claimed')
      })

      it('gets total rewards amount claimed', async () => {
        const totalClaimed = await app.getTotalAmountClaimed(rewardToken.address)
        assert.strictEqual(
          web3.fromWei(totalClaimed.toNumber(),'ether'),
          '2',
          'total claims incorrect: should be 2 Eth'
        )
      })

      it('gets total claims made', async () => {
        const totalClaims = await app.totalClaimsEach()
        assert.strictEqual(totalClaims.toString(), '2', 'total individual claims should be 2')
      })

      it('creates a merit reward that started in the past', async () => {
        let blockNumber = await getBlockNumber()
        meritRewardIds = rewardAdded(
          await app.newReward(
            'testReward',
            true,
            referenceToken.address,
            rewardToken.address,
            4e18,
            minBlock,
            blockNumber - minBlock,
            1,
            0
          )
        )
        let meritRewardId = meritRewardIds[0]

        assert(meritRewardId == 3, 'fourth reward should be id 3')
      })

      it('can read rewards array length', async () => {
        const rewardsLength = await app.getRewardsLength()
        assert.strictEqual(rewardsLength.toNumber(), 4, 'rewards array length incorrect')
      })

      it('creates a ETH reward', async () => {
        let blockNumber = await getBlockNumber()
        meritRewardIds = rewardAdded(
          await app.newReward(
            'testETHReward',
            true,
            referenceToken.address,
            0x0,
            4e18,
            blockNumber,
            6,
            1,
            0
          )
        )
        let meritRewardId = meritRewardIds[0]
        await referenceToken.generateTokens(root, 1e18)
        await referenceToken.generateTokens(contributor1, 1e18)
        await referenceToken.generateTokens(contributor2, 1e18)
        await referenceToken.generateTokens(contributor3, 1e18)
        await mineBlock()
        await mineBlock()
        assert.strictEqual(meritRewardId.toNumber(), 4, 'fifth reward should be id 4')
      })
    })

    context('Check require statements and edge cases', () => {
      let meritRewardIds

      it('fails to create reward without permission', async () => {
        return assertRevert(async () => {
          await app.newReward(
            'testReward',
            false,
            root,
            rewardToken.address,
            4e18,
            minBlock,
            1,
            1,
            0
          )
        })
      })

      it('fails to create reward with period starting prior to token creation', async () => {
        return assertRevert(async () => {
          await app.newReward(
            'testReward',
            false,
            referenceToken.address,
            rewardToken.address,
            4e18,
            minBlock-1,
            1,
            1,
            0
          )
        })
      })



      it('fails to create reward with invalid reference token', async () => {
        return assertRevert(async () => {
          await app.newReward(
            'testReward',
            false,
            root,
            rewardToken.address,
            4e18,
            minBlock,
            1,
            1,
            0
          )
        })
      })

      it('fails to create reward with invalid reward token', async () => {
        return assertRevert(async () => {
          await app.newReward(
            'testReward',
            false,
            referenceToken.address,
            root,
            4e18,
            minBlock,
            1,
            1,
            0
          )
        })
      })

      it('fails to create merit reward multiple occurances', async  () => {
        return assertRevert(async () => {
          await app.newReward(
            'testReward',
            true,
            referenceToken.address,
            rewardToken.address,
            6,
            4e18,
            minBlock,
            4,
            0
          )
        })
      })

      it('fails to create merit reward multiple occurances', async () => {
        assertRevert(async () => {
          await app.newReward(
            'testReward',
            true,
            referenceToken.address,
            rewardToken.address,
            6,
            4e18,
            minBlock,
            4,
            0
          )
        })
      })

      it('fails to create dividend reward too many occurances', async () => {
        assertRevert(async () => {
          await app.newReward(
            'testReward',
            false,
            referenceToken.address,
            rewardToken.address,
            6,
            4e18,
            minBlock,
            43,
            0
          )
        })
      })

      it('pays out a merit reward of zero with no token changes', async() => {
        let blockNumber = await getBlockNumber()
        const meritRewardId = rewardAdded(
          await app.newReward(
            'testReward',
            true,
            referenceToken.address,
            rewardToken.address,
            4e18,
            blockNumber,
            1,
            1,
            0
          )
        )
        const award = await app.getReward(meritRewardId)
        await app.claimReward(meritRewardId)
        assert.strictEqual(award[9].toNumber(), 0, 'amount should be 0')
      })

      it('pays out a merit reward of zero with no token changes for the user', async() => {
        let blockNumber = await getBlockNumber()
        const meritRewardId = rewardAdded(
          await app.newReward(
            'testReward',
            true,
            referenceToken.address,
            rewardToken.address,
            4e18,
            blockNumber,
            2,
            1,
            0
          )
        )
        const origBalance = await rewardToken.balanceOf(root)
        await referenceToken.generateTokens(contributor1, 1e18)
        await referenceToken.generateTokens(contributor2, 1e18)
        await mineBlock()
        await app.claimReward(meritRewardId)
        const newBalance = await rewardToken.balanceOf(root)
        assert.strictEqual(newBalance.toNumber(), origBalance.toNumber(), 'balance awarded should be zero')
      })

      it('cannot claim reward before period ends', async () => {
        let blockNumber = await getBlockNumber()
        meritRewardIds = rewardAdded(
          await app.newReward(
            'testReward',
            true,
            referenceToken.address,
            rewardToken.address,
            400e18,
            blockNumber,
            6,
            1,
            0
          )
        )
        let meritRewardId = meritRewardIds[0]
        await referenceToken.generateTokens(root, 1e18)
        await referenceToken.generateTokens(contributor1, 1e18)
        await referenceToken.generateTokens(contributor2, 1e18)
        await referenceToken.generateTokens(contributor3, 1e18)
        return assertRevert(async () => {
          await app.claimReward(meritRewardId, { from: root })
        })
        //await mineBlock()
        //await mineBlock()
        //assert(meritRewardId == 2, 'third reward should be id 2')
      })

      it('reverts if vault contains insufficient reward tokens', async () => {
        let meritRewardId = meritRewardIds[0]
        await mineBlock()
        return assertRevert(async () => {
          await app.claimReward(meritRewardId, { from: root })
        })
      })
    })
  })
})
