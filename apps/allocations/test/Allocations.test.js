/* global artifacts, assert, before, context, contract, it, web3 */
const { assertRevert } = require('@aragon/test-helpers/assertThrow')
const timeTravel = require('@aragon/test-helpers/timeTravel')(web3)
const BigNumber = require('bignumber.js')

/** Helper function to import truffle contract artifacts */
const getContract = name => artifacts.require(name)

/** Helper function to read events from receipts */
const getReceipt = (receipt, event, arg) =>
  receipt.logs.filter(l => l.event === event)[0].args[arg]

/** Useful constants */
const NULL_ADDR = '0x00'
const ANY_ADDR = ' 0xffffffffffffffffffffffffffffffffffffffff'
const TEN_DAYS = 864000
const SUPPORTS = [ 500, 200, 300 ]
const TOTAL_SUPPORT = 1000

contract('Allocations', accounts => {
  let APP_MANAGER_ROLE,
    CREATE_ACCOUNT_ROLE,
    CREATE_ALLOCATION_ROLE,
    EXECUTE_ALLOCATION_ROLE,
    EXECUTE_PAYOUT_ROLE,
    TRANSFER_ROLE
  let daoFact, app, appBase, vault, vaultBase, token

  // Setup test actor accounts
  const [ root, bobafett, dengar, bossk ] = accounts
  const candidateAddresses = [ bobafett, dengar, bossk ]

  // Setup dummy array of zeros
  const zeros = new Array(candidateAddresses.length).fill(0)

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
    appBase = await getContract('Allocations').new()
    vaultBase = await getContract('Vault').new()

    // Setup ACL roles constants
    APP_MANAGER_ROLE = await kernelBase.APP_MANAGER_ROLE()
    CREATE_ACCOUNT_ROLE = await appBase.CREATE_ACCOUNT_ROLE()
    CREATE_ALLOCATION_ROLE = await appBase.CREATE_ALLOCATION_ROLE()
    EXECUTE_ALLOCATION_ROLE = await appBase.EXECUTE_ALLOCATION_ROLE()
    EXECUTE_PAYOUT_ROLE = await appBase.EXECUTE_PAYOUT_ROLE()
    TRANSFER_ROLE = await vaultBase.TRANSFER_ROLE()

    /** Create the dao from the dao factory */
    const daoReceipt = await daoFact.newDAO(root)
    const dao = getContract('Kernel').at(
      getReceipt(daoReceipt, 'DeployDAO', 'dao')
    )

    /** Setup permission to install app */
    const acl = getContract('ACL').at(await dao.acl())
    await acl.createPermission(root, dao.address, APP_MANAGER_ROLE, root)

    /** Install an app instance to the dao */
    const appReceipt = await dao.newAppInstance(
      '0x1234',
      appBase.address,
      '0x',
      false
    )
    app = getContract('Allocations').at(
      getReceipt(appReceipt, 'NewAppProxy', 'proxy')
    )

    /** Setup permissions */
    await acl.createPermission(ANY_ADDR, app.address, CREATE_ACCOUNT_ROLE, root)
    await acl.createPermission(
      ANY_ADDR,
      app.address,
      CREATE_ALLOCATION_ROLE,
      root
    )
    await acl.createPermission(
      ANY_ADDR,
      app.address,
      EXECUTE_ALLOCATION_ROLE,
      root
    )
    await acl.createPermission(ANY_ADDR, app.address, EXECUTE_PAYOUT_ROLE, root)

    /** Install a vault instance to the dao */
    const vaultReceipt = await dao.newAppInstance(
      '0x5678',
      vaultBase.address,
      '0x',
      false
    )
    vault = getContract('Vault').at(
      getReceipt(vaultReceipt, 'NewAppProxy', 'proxy')
    )
    await vault.initialize()

    /** Setup permission to transfer funds */
    await acl.createPermission(app.address, vault.address, TRANSFER_ROLE, root)

    /** Create tokens */
    token = await getContract('MiniMeToken').new(
      NULL_ADDR,
      NULL_ADDR,
      0,
      'two',
      18,
      'two',
      true
    ) // empty parameters minime

    /** Initialize app */
    await app.initialize(vault.address, TEN_DAYS)
  })

  context('app creation and funded Payout', () => {
    let bobafettInitialBalance,
      dengarInitialBalance,
      bosskInitialBalance,
      accountId,
      ethPayoutId,
      deferredPayoutId

    before(async () => {
      bobafettInitialBalance = await web3.eth.getBalance(bobafett)
      dengarInitialBalance = await web3.eth.getBalance(dengar)
      bosskInitialBalance = await web3.eth.getBalance(bossk)

      accountId = (await app.newAccount(
        'Fett´s vett',
        0,
        true,
        web3.toWei(0.01, 'ether')
      )).logs[0].args.accountId.toNumber()

      await vault.deposit(NULL_ADDR, web3.toWei(0.03, 'ether'), {
        from: root,
        value: web3.toWei(0.03, 'ether'),
      })
      await token.generateTokens(root, 25e18)
      await token.transfer(vault.address, 25e18)

      // Eth payout
      ethPayoutId = (await app.setDistribution(
        candidateAddresses,
        SUPPORTS,
        zeros,
        '',
        'ETH description',
        zeros,
        zeros,
        accountId,
        1,
        0x0,
        0x0,
        web3.toWei(0.01, 'ether')
      )).logs[0].args.payoutId.toNumber()

      // Deferred payout
      deferredPayoutId = (await app.setDistribution(
        candidateAddresses,
        SUPPORTS,
        zeros,
        '',
        'ETH description',
        zeros,
        zeros,
        accountId,
        2,
        Date.now() / 1000 + 1,
        86400,
        web3.toWei(0.01, 'ether')
      )).logs[0].args.payoutId.toNumber()
    })

    it('app initialized properly', async () => {
      const initBlock = await app.getInitializationBlock()
      assert.isAbove(
        initBlock.toNumber(),
        0,
        'App was not initialized properly'
      )
    })

    it('can get the created Account', async () => {
      const accountMembers = await app.getAccount(accountId)
      assert.equal(
        accountMembers[0],
        'Fett´s vett',
        'Payout metadata incorrect'
      )
    })

    it('can get period information', async () => {
      const periodNo = (await app.getCurrentPeriodId()).toNumber()
      const [ isCurrent, startTime, endTime ] = await app.getPeriod(periodNo)
      assert(isCurrent, 'current period is current')
      assert.strictEqual(
        endTime - startTime,
        TEN_DAYS - 1,
        'should be equal to ten days minus one second'
      )
    })

    it('sets the distribution (eth)', async () => {
      const candidateArrayLength = (await app.getNumberOfCandidates(
        accountId,
        ethPayoutId
      )).toNumber()
      let storedSupport = []
      let supportVal

      for (let i = 0; i < candidateArrayLength; i++) {
        supportVal = (await app.getPayoutDistributionValue(
          accountId,
          ethPayoutId,
          i
        )).toNumber()
        assert.equal(
          SUPPORTS[i],
          supportVal,
          'support distributions do not match what is specified'
        )
        storedSupport.push(supportVal)
      }
      assert.equal(
        SUPPORTS.length,
        storedSupport.length,
        'distribution array lengths do not match'
      )
    })

    it('executes the payout (eth)', async () => {
      const bobafettBalance = BigNumber(await web3.eth.getBalance(bobafett))
      const dengarBalance = BigNumber(await web3.eth.getBalance(dengar))
      const bosskBalance = BigNumber(await web3.eth.getBalance(bossk))

      assert.equal(
        bobafettBalance.minus(bobafettInitialBalance),
        (web3.toWei(0.01, 'ether') * SUPPORTS[0]) / TOTAL_SUPPORT,
        'bobafett expense'
      )
      assert.equal(
        dengarBalance.minus(dengarInitialBalance),
        (web3.toWei(0.01, 'ether') * SUPPORTS[1]) / TOTAL_SUPPORT,
        'dengar expense'
      )
      assert.equal(
        bosskBalance.minus(bosskInitialBalance),
        (web3.toWei(0.01, 'ether') * SUPPORTS[2]) / TOTAL_SUPPORT,
        'bossk expense'
      )
    })

    it('retrieves payout info details (eth)', async () => {
      const payoutInfo = await app.getPayout(accountId, ethPayoutId)
      assert.strictEqual(
        payoutInfo[0].toNumber(),
        1e16,
        'payout amount incorrect'
      )
      assert.strictEqual(
        payoutInfo[1].toNumber(),
        1,
        'payout Should not be recurring'
      )
      assert.strictEqual(
        payoutInfo[2].toNumber(),
        0,
        'recurring payout start time incorrect'
      )
      assert.strictEqual(
        payoutInfo[3].toNumber(),
        0,
        'recurring payout period length incorrect'
      )
    })

    it('retrieves payout description', async () => {
      const payoutDescription = await app.getPayoutDescription(
        accountId,
        ethPayoutId
      )
      assert.strictEqual(
        payoutDescription,
        'ETH description',
        'Payout description incorrectly stored'
      )
    })

    it('sets the distribution (token)', async () => {
      const candidateArrayLength = (await app.getNumberOfCandidates(
        accountId,
        deferredPayoutId
      )).toNumber()
      let storedSupport = []
      let supportVal

      for (let i = 0; i < candidateArrayLength; i++) {
        supportVal = (await app.getPayoutDistributionValue(
          accountId,
          deferredPayoutId,
          i
        )).toNumber()
        assert.equal(
          SUPPORTS[i],
          supportVal,
          'support distributions do not match what is specified'
        )
        storedSupport.push(supportVal)
      }
      assert.equal(
        SUPPORTS.length,
        storedSupport.length,
        'distribution array lengths do not match'
      )
    })

    it('executes the payout (recurring)', async () => {
      timeTravel(864000)
      await app.executePayout(accountId, deferredPayoutId, 0)
      timeTravel(864000)
      await app.executePayout(accountId, deferredPayoutId, 1)
      await app.executePayout(accountId, deferredPayoutId, 2)
      const bobafettBalance = BigNumber(await web3.eth.getBalance(bobafett))
      const dengarBalance = BigNumber(await web3.eth.getBalance(dengar))
      const bosskBalance = BigNumber(await web3.eth.getBalance(bossk))

      assert.equal(
        bobafettBalance.minus(bobafettInitialBalance),
        (web3.toWei(0.03, 'ether') * SUPPORTS[0]) / TOTAL_SUPPORT,
        'bobafett expense'
      )
      assert.equal(
        dengarBalance.minus(dengarInitialBalance),
        (web3.toWei(0.03, 'ether') * SUPPORTS[1]) / TOTAL_SUPPORT,
        'dengar expense'
      )
      assert.equal(
        bosskBalance.minus(bosskInitialBalance),
        (web3.toWei(0.03, 'ether') * SUPPORTS[2]) / TOTAL_SUPPORT,
        'bossk expense'
      )
    })

    it('cannot execute more than once if non-recurring', async () => {
      return assertRevert(async () => {
        await app.runPayout(accountId, ethPayoutId)
      })
    })

    context('invalid workflows', () => {
      before(async () => {
        accountId = (await app.newAccount(
          'Fett´s vett',
          false,
          0,
          0
        )).logs[0].args.accountId.toNumber()
      })

      it('cannot set Distribution before funding the account (eth)', async () => {
        return assertRevert(async () => {
          await app.setDistribution(
            candidateAddresses,
            SUPPORTS,
            zeros,
            '',
            '',
            zeros,
            zeros,
            accountId,
            false,
            0,
            web3.toWei(0.01, 'ether'),
            0x0
          )
        })
      })

      it('cannot set Distribution before funding the account (token)', async () => {
        return assertRevert(async () => {
          await app.setDistribution(
            candidateAddresses,
            SUPPORTS,
            zeros,
            '',
            '',
            zeros,
            zeros,
            accountId,
            false,
            0,
            web3.toWei(26, 'ether'),
            token.address
          )
        })
      })
    })
  })

  context('Recurring Payout', () => {
    let bobafettInitialBalance
    let dengarInitialBalance
    let bosskInitialBalance
    let accountId

    before(async () => {
      bobafettInitialBalance = await web3.eth.getBalance(bobafett)
      dengarInitialBalance = await web3.eth.getBalance(dengar)
      bosskInitialBalance = await web3.eth.getBalance(bossk)
      accountId = (await app.newAccount(
        'Fett´s vett',
        false,
        0,
        0
      )).logs[0].args.accountId.toNumber()
      await vault.deposit(NULL_ADDR, web3.toWei(0.02, 'ether'), {
        from: root,
        value: web3.toWei(0.02, 'ether'),
      })
    })

    it('cannot occur more frequently than daily', async () => {
      return assertRevert(async () => {
        await app.setDistribution(
          candidateAddresses,
          SUPPORTS,
          zeros,
          '',
          '',
          zeros,
          zeros,
          accountId,
          2,
          0x0,
          86300,
          web3.toWei(0.01, 'ether'),
          { from: root }
        )
      })
    })

    it('will not execute more frequently than the specified period', async () => {
      const currentTimestamp = (await web3.eth.getBlock('latest')).timestamp

      const payoutId = (await app.setDistribution(
        candidateAddresses,
        SUPPORTS,
        zeros,
        '',
        '',
        zeros,
        zeros,
        accountId,
        2,
        currentTimestamp, // This is the internal ganache timestamp
        86400,
        web3.toWei(0.01, 'ether')
      )).logs[0].args.payoutId.toNumber()

      const bobafettBalance = BigNumber(await web3.eth.getBalance(bobafett))
      const dengarBalance = BigNumber(await web3.eth.getBalance(dengar))
      const bosskBalance = BigNumber(await web3.eth.getBalance(bossk))

      assert.equal(
        bobafettBalance.minus(bobafettInitialBalance).toNumber(),
        (web3.toWei(0.01, 'ether') * SUPPORTS[0]) / TOTAL_SUPPORT,
        'bounty hunter expense 1 not paid out'
      )
      assert.equal(
        dengarBalance.minus(dengarInitialBalance),
        (web3.toWei(0.01, 'ether') * SUPPORTS[1]) / TOTAL_SUPPORT,
        'bounty hunter expense 2 not paid out'
      )
      assert.equal(
        bosskBalance.minus(bosskInitialBalance),
        (web3.toWei(0.01, 'ether') * SUPPORTS[2]) / TOTAL_SUPPORT,
        'bounty hunter expense 3 not paid out'
      )
      timeTravel(43200)
      return assertRevert(async () => {
        await app.runPayout(accountId, payoutId)
      })
    })
  })
})
