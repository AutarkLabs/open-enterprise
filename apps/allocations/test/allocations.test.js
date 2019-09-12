/* global artifact, ... */
const {
  ACL,
  DAOFactory,
  EVMScriptRegistryFactory,
  Kernel,
  MiniMeToken
} = require('@tps/test-helpers/artifacts')

const Allocations = artifacts.require('Allocations')

const { assertRevert } = require('@tps/test-helpers/assertThrow')
const timetravel = require('@tps/test-helpers/timeTravel')(web3)
const Vault = artifacts.require('Vault')
const BigNumber = require('bignumber.js')
const NULL_ADDRESS = '0x00'

const failedPayment = receipt =>
  receipt.logs.filter(x => x.event == 'PaymentFailure')[0].args // TODO: not-used

const ANY_ADDR = ' 0xffffffffffffffffffffffffffffffffffffffff'
const TEM_DAYS = 864000

contract('Allocations App', accounts => {
  let daoFact,
    vaultBase,
    vault = {},
    app = {}

  const root = accounts[0]

  before(async () => {
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

    let receipt = await dao.newAppInstance(
      '0x1234',
      (await Allocations.new()).address,
      0x0,
      false,
      { from: root }
    )

    app = Allocations.at(
      receipt.logs.filter(l => l.event == 'NewAppProxy')[0].args.proxy
    )

    await acl.createPermission(
      ANY_ADDR,
      app.address,
      await app.CREATE_ACCOUNT_ROLE(),
      root,
      { from: root }
    )
    await acl.createPermission(
      ANY_ADDR,
      app.address,
      await app.CREATE_ALLOCATION_ROLE(),
      root,
      { from: root }
    )
    await acl.createPermission(
      ANY_ADDR,
      app.address,
      await app.EXECUTE_PAYOUT_ROLE(),
      root,
      { from: root }
    )
    await acl.createPermission(
      root,
      app.address,
      await app.EXECUTE_ALLOCATION_ROLE(),
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

    await app.initialize(vault.address, 864000, { from: accounts[0] })
  })

  context('app creation and funded Payout', () => {
    const empire = accounts[0]
    const bobafett = accounts[1]
    const dengar = accounts[2]
    const bossk = accounts[3]

    let bobafettInitialBalance,
      dengarInitialBalance,
      bosskInitialBalance,
      accountId,
      payoutId,
      supports,
      token

    before(async () => {
      token = await MiniMeToken.new(NULL_ADDRESS, NULL_ADDRESS, 0, 'one', 18, 'one', true) // empty parameters minime
      bobafettInitialBalance = await web3.eth.getBalance(bobafett)
      dengarInitialBalance = await web3.eth.getBalance(dengar)
      bosskInitialBalance = await web3.eth.getBalance(bossk)
      candidateAddresses = [ bobafett, dengar, bossk ]
      accountId = (await app.newAccount(
        'Fett\'s vett',
        0,
        true,
        web3.toWei(0.03, 'ether')
      )).logs[0].args.accountId.toNumber()

      await vault.deposit(
        0, // zero address
        web3.toWei(0.1, 'ether'), 
        { from: empire, value: web3.toWei(0.1, 'ether') }
      )
      supports = [ 500, 200, 300 ]
      totalsupport = 1000
      await token.generateTokens(root, 25e18)
      await token.transfer(vault.address, 25e18)
      const zeros = new Array(candidateAddresses.length).fill(0)
      const timestamp = (await web3.eth.getBlock('latest')).timestamp
      ethPayoutId = (await app.setDistribution(
        candidateAddresses,
        supports,
        zeros,
        '',
        'ETH description',
        zeros,
        zeros,
        accountId,
        1,
        0x0,
        0x0,
        web3.toWei(0.01, 'ether'),
      )).logs[0].args.payoutId.toNumber()
      deferredPayoutId = (await app.setDistribution(
        candidateAddresses,
        supports,
        zeros,
        '',
        'ETH description',
        zeros,
        zeros,
        accountId,
        2,
        timestamp,
        86400,
        web3.toWei(0.01, 'ether'),
      )).logs[0].args.payoutId.toNumber()
    })

    it('app initialized properly', async () => {
      let initBlock = await app.getInitializationBlock()
      assert.isAbove(
        initBlock.toNumber(),
        0,
        'App was not initialized properly'
      )
    })

    it('can create a new Account', async () => {
      accountMembers = await app.getAccount(accountId)
      assert.equal(accountMembers[0], 'Fett\'s vett', 'Payout metadata incorrect')
    })

    it('can get period information', async () => {
      periodNo = (await app.getCurrentPeriodId()).toNumber()
      const [
        isCurrent,
        startTime,
        endTime,
        ...txIds
      ] = await app.getPeriod(periodNo)
      assert(isCurrent, 'current period is current')
      assert.strictEqual(endTime - startTime, TEM_DAYS - 1, 'should be equal to ten days minus one second')
      
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
          supports[i],
          supportVal,
          'support distributions do not match what is specified'
        )
        storedSupport.push(supportVal)
      }
      assert.equal(
        supports.length,
        storedSupport.length,
        'distribution array lengths do not match'
      )
    })

    it('executes the payout (eth)', async () => {
      await app.runPayout(accountId, ethPayoutId)
      const bobafettBalance = await web3.eth.getBalance(bobafett)
      const dengarBalance = await web3.eth.getBalance(dengar)
      const bosskBalance = await web3.eth.getBalance(bossk)
      assert.equal(
        bobafettBalance.toNumber() - bobafettInitialBalance.toNumber(),
        (web3.toWei(0.01, 'ether') * supports[0]) / totalsupport,
        'bobafett expense'
      )
      assert.equal(
        dengarBalance.toNumber() - dengarInitialBalance.toNumber(),
        (web3.toWei(0.01, 'ether') * supports[1]) / totalsupport,
        'dengar expense'
      )
      assert.equal(
        bosskBalance.toNumber() - bosskInitialBalance.toNumber(),
        (web3.toWei(0.01, 'ether') * supports[2]) / totalsupport,
        'bossk expense'
      )
    })

    it('retrieves payout info details (eth)', async () => {
      const payoutInfo = await app.getPayout(accountId,ethPayoutId)
      assert.strictEqual(payoutInfo[0].toNumber(), 1e16, 'payout amount incorrect')
      assert.strictEqual(payoutInfo[1].toNumber(), 1, 'payout Should not be recurring')
      assert.strictEqual(payoutInfo[2].toNumber(), 0, 'recurring payout start time incorrect')
      assert.strictEqual(payoutInfo[3].toNumber(), 0, 'recurring payout period length incorrect')
    })

    it('retrieves payout description', async () =>{
      const payoutDescription = await app.getPayoutDescription(accountId,ethPayoutId)
      assert.strictEqual(payoutDescription, 'ETH description', 'Payout description incorrectly stored')
    })

    it('sets the distribution (token)', async () => {
      const candidateArrayLength = (await app.getNumberOfCandidates(
        accountId,
        deferredPayoutId,
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
          supports[i],
          supportVal,
          'support distributions do not match what is specified'
        )
        storedSupport.push(supportVal)
      }
      assert.equal(
        supports.length,
        storedSupport.length,
        'distribution array lengths do not match'
      )
    })

    it('executes the payout (recurring)', async () => {
      timetravel(86400*5)
      await app.runPayout(accountId, deferredPayoutId)

      const bobafettBalance = await web3.eth.getBalance(bobafett)
      const dengarBalance = await web3.eth.getBalance(dengar)
      const bosskBalance = await web3.eth.getBalance(bossk)

      assert.equal(
        bobafettBalance.toNumber() - bobafettInitialBalance.toNumber(),
        (web3.toWei(0.03, 'ether') * supports[0]) / totalsupport,
        'bobafett expense'
      )
      assert.equal(
        dengarBalance.toNumber() - dengarInitialBalance.toNumber(),
        (web3.toWei(0.03, 'ether') * supports[1]) / totalsupport,
        'dengar expense'
      )
      assert.equal(
        bosskBalance.toNumber() - bosskInitialBalance.toNumber(),
        (web3.toWei(0.03, 'ether') * supports[2]) / totalsupport,
        'bossk expense'
      )
    })

    it('cannot execute more than once if non-recurring', async () => {
      const receipt =  await app.runPayout(accountId, ethPayoutId)
      const firstFailedPayment = failedPayment(receipt)
      assert.equal(accountId, firstFailedPayment.accountId)
      assert.equal(ethPayoutId, firstFailedPayment.payoutId)
      assert.equal(0, firstFailedPayment.candidateId)
    })

    context('invalid workflows', () => {
      before(async () => {
        accountId = (await app.newAccount(
          'Fett\'s vett',
          false,
          0,
          0
        )).logs[0].args.accountId.toNumber()
      })

      it('cannot set Distribution before funding the account (eth)', async () => {
        supports = [ 500, 200, 300 ]
        totalsupport = 1000
        const zeros = new Array(candidateAddresses.length).fill(0)
        return assertRevert(async () => {
          await app.setDistribution(
            candidateAddresses,
            supports,
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
        supports = [ 500, 200, 300 ]
        totalsupport = 1000
        const zeros = new Array(candidateAddresses.length).fill(0)
        return assertRevert(async () => {
          await app.setDistribution(
            candidateAddresses,
            supports,
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
    const empire = accounts[0]
    const bobafett = accounts[1]
    const dengar = accounts[2]
    const bossk = accounts[3]

    let bobafettInitialBalance
    let dengarInitialBalance
    let bosskInitialBalance
    let accountId
    let supports

    before(async () => {
      bobafettInitialBalance = await web3.eth.getBalance(bobafett)
      dengarInitialBalance = await web3.eth.getBalance(dengar)
      bosskInitialBalance = await web3.eth.getBalance(bossk)
      candidateAddresses = [ bobafett, dengar, bossk ]
      accountId = (await app.newAccount(
        'Fett\'s vett',
        false,
        0,
        0
      )).logs[0].args.accountId.toNumber()
      await vault.deposit(
        0, // zero address
        web3.toWei(0.02, 'ether'), 
        { from: empire, value: web3.toWei(0.02, 'ether') }
      )
    })

    it('cannot occur more frequently than daily', async () => {
      supports = [ 300, 400, 300 ]
      totalsupport = 1000
      const zeros = new Array(candidateAddresses.length).fill(0)
      return assertRevert(async () => {
        await app.setDistribution(
          candidateAddresses,
          supports,
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
          { from: empire, }
        )
      })
    })

    it('will not execute more frequently than the specified period', async () => {
      supports = [ 300, 400, 300 ]
      totalsupport = 1000

      bobafettInitialBalance = await web3.eth.getBalance(bobafett)
      dengarInitialBalance = await web3.eth.getBalance(dengar)
      bosskInitialBalance = await web3.eth.getBalance(bossk)
      const zeros = new Array(candidateAddresses.length).fill(0)
      const timestamp = (await web3.eth.getBlock('latest')).timestamp
      payoutId = (await app.setDistribution(
        candidateAddresses,
        supports,
        zeros,
        '',
        '',
        zeros,
        zeros,
        accountId,
        2,
        timestamp,  // Start time must be current time
        86400,
        web3.toWei(0.01, 'ether'),
      )).logs[0].args.payoutId.toNumber()
      await app.runPayout(accountId, payoutId)
      const bobafettBalance = await web3.eth.getBalance(bobafett)
      const dengarBalance = await web3.eth.getBalance(dengar)
      const bosskBalance = await web3.eth.getBalance(bossk)
      assert.equal(
        bobafettBalance.toNumber() - bobafettInitialBalance.toNumber(),
        (web3.toWei(0.01, 'ether') * supports[0]) / totalsupport,
        'bounty hunter expense 1 not paid out'
      )
      assert.equal(
        dengarBalance.toNumber() - dengarInitialBalance.toNumber(),
        (web3.toWei(0.01, 'ether') * supports[1]) / totalsupport,
        'bounty hunter expense 2 not paid out'
      )
      assert.equal(
        bosskBalance.toNumber() - bosskInitialBalance.toNumber(),
        (web3.toWei(0.01, 'ether') * supports[2]) / totalsupport,
        'bounty hunter expense 3 not paid out'
      )
      timetravel(43200)
      const receipt =  await app.runPayout(accountId, ethPayoutId)
      const firstFailedPayment = failedPayment(receipt)
      assert.equal(accountId, firstFailedPayment.accountId)
      assert.equal(payoutId, firstFailedPayment.payoutId)
      assert.equal(0, firstFailedPayment.candidateId)
    })
  })
})
