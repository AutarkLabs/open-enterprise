const { assertRevert } = require('@aragon/test-helpers/assertThrow')
const getBlockNumber = require('@aragon/test-helpers/blockNumber')(web3)
const mineBlock = require('./helpers/mineBlock')(web3)

/** Helper function to import truffle contract artifacts */
const getContract = name => artifacts.require(name)

/** Helper function to read events from receipts */
const getReceipt = (receipt, event, arg) => receipt.logs.filter(l => l.event === event)[0].args[arg]

/** Helper function to read reward added events */
const rewardAdded = receipt => receipt.logs.filter(x => x.event == 'RewardAdded').map(reward => reward.args.rewardId)

/** Useful constants */
const ANY_ADDRESS = '0xffffffffffffffffffffffffffffffffffffffff'
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

contract('Rewards', accounts => {
  let APP_MANAGER_ROLE, ADD_REWARD_ROLE, TRANSFER_ROLE
  let daoFact, app, appBase, vault, vaultBase, referenceToken, rewardToken, minBlock

  // Setup test actor accounts
  const [ root, contributor1, contributor2, contributor3 ] = accounts

  before(async () => {
    // Create Base DAO and App contracts
    const kernelBase = await getContract('Kernel').new(true) // petrify immediately
    const aclBase = await getContract('ACL').new()
    const regFact = await getContract('EVMScriptRegistryFactory').new()
    daoFact = await getContract('DAOFactory').new(
      kernelBase.address,
      aclBase.address,
      regFact.address
    )
    appBase = await getContract('Rewards').new()
    vaultBase = await getContract('Vault').new()

    // Setup ACL roles constants
    APP_MANAGER_ROLE = await kernelBase.APP_MANAGER_ROLE()
    ADD_REWARD_ROLE = await appBase.ADD_REWARD_ROLE()
    TRANSFER_ROLE = await vaultBase.TRANSFER_ROLE()


    /** Create the dao from the dao factory */
    const daoReceipt = await daoFact.newDAO(root)
    const dao = getContract('Kernel').at(getReceipt(daoReceipt, 'DeployDAO', 'dao'))

    /** Setup permission to install app */
    const acl = getContract('ACL').at(await dao.acl())
    await acl.createPermission(root, dao.address, APP_MANAGER_ROLE, root)

    /** Install an app instance to the dao */
    const appReceipt = await dao.newAppInstance('0x1234', appBase.address, '0x', false)
    app = getContract('Rewards').at(getReceipt(appReceipt, 'NewAppProxy', 'proxy'))

    /** Setup permission to create rewards */
    await acl.createPermission(ANY_ADDRESS, app.address, ADD_REWARD_ROLE, root)

    /** Install a vault instance to the dao */
    const vaultReceipt = await dao.newAppInstance('0x5678', vaultBase.address, '0x', false)
    vault = getContract('Vault').at(getReceipt(vaultReceipt, 'NewAppProxy', 'proxy'))
    await vault.initialize()

    /** Setup permission to transfer funds */
    await acl.createPermission(app.address, vault.address, TRANSFER_ROLE, root)

    /** Create tokens */
    referenceToken = await getContract('MiniMeToken').new(NULL_ADDRESS, NULL_ADDRESS, 0, 'one', 18, 'one', true) // empty parameters minime
    rewardToken = await getContract('MiniMeToken').new(NULL_ADDRESS, NULL_ADDRESS, 0, 'two', 18, 'two', true) // empty parameters minime
    minBlock = await getBlockNumber()
  })

  context('pre-initialization', () => {
    it('will not initialize with invalid vault address', async () => {
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

      let rewardInformation
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
        assert(balance == 1e18, 'reward should be 1e18 or 1eth equivalent')
        rewardInformation = await app.getReward(dividendRewardIds[0])
        assert.strictEqual(rewardInformation[10], true, 'reward is claimed')
      })

      it('receives rewards merit', async () => {
        await app.claimReward(meritRewardIds[0])
        const balance = await rewardToken.balanceOf(root)
        assert(balance == 2e18, 'reward should be 2e18 or 2eth equivalent; 1 for each reward')
        rewardInformation = await app.getReward(meritRewardIds[0])
        assert.strictEqual(rewardInformation[10], true, 'reward is claimed')
      })

      it('gets total rewards amount claimed', async () => {
        const totalClaimed = await app.getTotalAmountClaimed(rewardToken.address)
        assert.strictEqual(
          web3.fromWei(totalClaimed.toNumber(), 'ether'),
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
            minBlock - 1,
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

      it('fails to create merit reward multiple occurrences', async () => {
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

      it('fails to create dividend reward too many occurrences', async () => {
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

      it('pays out a merit reward of zero with no token changes', async () => {
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

      it('pays out a merit reward of zero with no token changes for the user', async () => {
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