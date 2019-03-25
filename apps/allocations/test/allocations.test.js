/* global artifact, ... */
const {
  ACL,
  DAOFactory,
  EVMScriptRegistryFactory,
  Kernel,
} = require('@tps/test-helpers/artifacts')

const Allocations = artifacts.require('Allocations')

const { assertRevert } = require('@tps/test-helpers/assertThrow')
const timetravel = require('@tps/test-helpers/timeTravel')(web3)

// TODO: Fix Vault not loading artifacts error
// const Vault = artifacts.require('@aragon/apps-vault/contracts/Vault')

// const createdPayoutId = receipt =>
//   receipt.logs.filter(x => x.event == 'StartPayout')[0].args.voteId // TODO: not-used

const ANY_ADDR = ' 0xffffffffffffffffffffffffffffffffffffffff'

contract('Allocations App', accounts => {
  let daoFact,
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

    // TODO: Revert to use regular function call when truffle gets updated
    // read: https://github.com/AutarkLabs/planning-suite/pull/243
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
      await app.START_PAYOUT_ROLE(),
      root,
      { from: root }
    )
    await acl.createPermission(
      ANY_ADDR,
      app.address,
      await app.SET_DISTRIBUTION_ROLE(),
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

    // TODO: Fix vault
    // vault = Vault.at(
    //   receipt.logs.filter(l => l.event == 'NewAppProxy')[0].args.proxy
    // )

    await app.initialize( 0x0, { from: accounts[0] })
  })

  context('app creation and funded Payout', () => {
    const empire = accounts[0]
    const bobafett = accounts[1]
    const dengar = accounts[2]
    const bossk = accounts[3]

    let bobafettInitialBalance
    let dengarInitialBalance
    let bosskInitialBalance
    let accountId
    let payoutId
    let supports

    before(async () => {
      bobafettInitialBalance = await web3.eth.getBalance(bobafett)
      dengarInitialBalance = await web3.eth.getBalance(dengar)
      bosskInitialBalance = await web3.eth.getBalance(bossk)
      candidateAddresses = [ bobafett, dengar, bossk ]
    })

    beforeEach(async () => {
      accountId = (await app.newAccount(
        'Fett\'s vett',
        web3.toWei(1, 'ether'),
        0x0
      )).logs[0].args.accountId.toNumber()

      await app.fund(accountId, {
        from: empire,
        value: web3.toWei(0.01, 'ether'),
      })

      supports = [ 500, 200, 300 ]
      totalsupport = 1000
      const zeros = new Array(candidateAddresses.length).fill(0)
      payoutId = (await app.setDistribution(
        candidateAddresses,
        supports,
        zeros,
        '',
        zeros,
        zeros,
        accountId,
        false,
        0,
        web3.toWei(0.01, 'ether')
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
      assert.equal(accountMembers[2], 'Fett\'s vett', 'Payout metadata incorrect')
      assert.equal(
        accountMembers[0].toNumber(),
        10000000000000000,
        'Payout Balance Incorrect'
      )
      assert.equal(
        accountMembers[1].toNumber(),
        1000000000000000000,
        'Payout Limit incorrect'
      )
    })

    it('sets the distribution', async () => {
      const candidateArrayLength = (await app.getNumberOfCandidates(
        accountId,
        payoutId,
      )).toNumber()
      let storedSupport = []
      let supportVal

      for (let i = 0; i < candidateArrayLength; i++) {
        supportVal = (await app.getPayoutDistributionValue(
          accountId,
          payoutId,
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

    it('retrieves payout info details', async () => {
      const payoutInfo = await app.getPayout(accountId,payoutId)
      assert.strictEqual(payoutInfo[0].toNumber(), 1e16, 'payout amount incorrect')
      assert.strictEqual(payoutInfo[1], false, 'payout Should not be recurring')
      assert.strictEqual(payoutInfo[2].toNumber(), 0, 'recurring payout start time incorrect')
      assert.strictEqual(payoutInfo[3].toNumber(), 0, 'recurring payout period length incorrect')
    })

    it('executes the payout', async () => {
      await app.runPayout(accountId, payoutId, { from: empire })
      const bobafettBalance = await web3.eth.getBalance(bobafett)
      const dengarBalance = await web3.eth.getBalance(dengar)
      const bosskBalance = await web3.eth.getBalance(bossk)
      assert.equal(
        bobafettBalance.toNumber() - bobafettInitialBalance.toNumber(),
        (web3.toWei(0.01, 'ether') * supports[0]) / totalsupport,
        'bounty hunter expense'
      )
      assert.equal(
        dengarBalance.toNumber() - dengarInitialBalance.toNumber(),
        (web3.toWei(0.01, 'ether') * supports[1]) / totalsupport,
        'bounty hunter expense'
      )
      assert.equal(
        bosskBalance.toNumber() - bosskInitialBalance.toNumber(),
        (web3.toWei(0.01, 'ether') * supports[2]) / totalsupport,
        'bounty hunter expense'
      )
    })

    it('can send payouts to other allocations accounts', async () => {
      const account1Info1 = await app.getAccount(accountId)
      accountAddress1 = account1Info1[4]

      accountId2 = (await app.newAccount(
        'Fett\'s new ship',
        web3.toWei(1, 'ether'),
        0x0
      )).logs[0].args.accountId.toNumber()

      await app.fund(accountId2, {
        from: empire,
        value: web3.toWei(1.00, 'ether'),
      })


      testCandidates = [ ...candidateAddresses, accountAddress1 ]
      supports = [ 500, 200, 150, 150 ]
      totalsupport = 1000
      const zeros = new Array(testCandidates.length).fill(0)
      const payoutId2 = (await app.setDistribution(
        testCandidates,
        supports,
        zeros,
        '',
        zeros,
        zeros,
        accountId2,
        false,
        0,
        web3.toWei(1.00, 'ether')
      )).logs[0].args.payoutId.toNumber()
      await app.runPayout(accountId2, payoutId2)

      const account1Info2 = await app.getAccount(accountId)
      assert.strictEqual(
        account1Info2[0].sub(account1Info1[0]).toString(),
        web3.toWei(0.15, 'ether'),
        'account balance difference doesn\'t match transferred amount'
      )


    })

    it('can fund account via proxy address', async () => {
      const account1Info1 = await app.getAccount(accountId)
      const accountAddress1 = account1Info1[4]
      await web3.eth.sendTransaction({ from: empire, to: accountAddress1, value: web3.toWei(1.00, 'ether'), })
      const account1Info2 = await app.getAccount(accountId)
      assert.strictEqual(
        account1Info2[0].sub(account1Info1[0]).toString(),
        web3.toWei(1.0, 'ether'),
        'account balance difference doesn\'t match transferred amount'
      )
    })

    it('can execute payouts out of order of creation', async () => {
      await app.fund(accountId, {
        from: empire,
        value: web3.toWei(1.00, 'ether'),
      })
      const zeros = new Array(candidateAddresses.length).fill(0)
      const payoutId2 = (await app.setDistribution(
        candidateAddresses,
        supports,
        zeros,
        '',
        zeros,
        zeros,
        accountId,
        false,
        0,
        web3.toWei(1.00, 'ether')
      )).logs[0].args.payoutId.toNumber()

      await app.runPayout(accountId, payoutId2)
      await app.runPayout(accountId, payoutId)
    })

    it('cannot execute more than once if non-recurring', async () => {
      await app.fund(accountId, {
        from: empire,
        value: web3.toWei(1.00, 'ether'),
      })
      await app.runPayout(accountId, payoutId)
      return assertRevert(async () => {
        await app.runPayout(accountId, payoutId)
      })
    })

    context('invalid workflows', () => {
      beforeEach(async () => {
        accountId = (await app.newAccount(
          'Fett\'s vett',
          web3.toWei(1, 'ether'),
          0x0
        )).logs[0].args.accountId.toNumber()

        //await app.fund(accountId, {
        //  from: empire,
        //  value: web3.toWei(0.01, 'ether'),
        //})
      })

      it('cannot set Distribution before funding the account', async () => {
        supports = [ 500, 200, 300 ]
        totalsupport = 1000
        const zeros = new Array(candidateAddresses.length).fill(0)
        return assertRevert(async () => {
          await app.setDistribution(
            candidateAddresses,
            supports,
            zeros,
            '',
            zeros,
            zeros,
            accountId,
            false,
            0,
            web3.toWei(0.01, 'ether')
          )
        })
      })
      it('cannot set Distribution above account limit', async () => {
        await app.fund(accountId, {
          from: empire,
          value: web3.toWei(3.00, 'ether'),
        })

        supports = [ 500, 200, 300 ]
        totalsupport = 1000
        const zeros = new Array(candidateAddresses.length).fill(0)
        return assertRevert(async () => {
          await app.setDistribution(
            candidateAddresses,
            supports,
            zeros,
            '',
            zeros,
            zeros,
            accountId,
            false,
            0,
            web3.toWei(1.01, 'ether')
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
    })

    beforeEach(async () => {
      accountId = (await app.newAccount(
        'Fett\'s auto warranty',
        web3.toWei(0.1, 'ether'),
        0x0
      )).logs[0].args.accountId.toNumber()
    })
    xit('cannot occur more frequently than daily', async () => {
      supports = [ 300, 400, 300 ]
      totalsupport = 1000
      const zeros = new Array(candidateAddresses.length).fill(0)
      await app.fund(accountId, {
        from: empire,
        value: web3.toWei(0.01, 'ether'),
      })

      return assertRevert(async () => {
        await app.setDistribution(
          candidateAddresses,
          supports,
          zeros,
          '',
          zeros,
          zeros,
          accountId,
          true,
          86300,
          web3.toWei(0.01, 'ether'),
          { from: empire, }
        )
      })
    })

    it('will not execute more frequently than the specified period', async () => {
      supports = [ 300, 400, 300 ]
      totalsupport = 1000
      const zeros = new Array(candidateAddresses.length).fill(0)
      await app.fund(accountId, {
        from: empire,
        value: web3.toWei(0.01, 'ether'),
      })
      payoutId = (await app.setDistribution(
        candidateAddresses,
        supports,
        zeros,
        '',
        zeros,
        zeros,
        accountId,
        true,
        86400,
        web3.toWei(0.01, 'ether')
      )).logs[0].args.payoutId.toNumber()
      timetravel(86500)
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

      await app.fund(accountId, {
        from: empire,
        value: web3.toWei(0.01, 'ether'),
      })
      timetravel(43200)
      return assertRevert(async () => {
        await app.runPayout(accountId, payoutId)
      })
    })
  })
})
