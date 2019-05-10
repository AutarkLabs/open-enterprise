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

// const createdPayoutId = receipt =>
//   receipt.logs.filter(x => x.event == 'StartPayout')[0].args.voteId // TODO: not-used

const ANY_ADDR = ' 0xffffffffffffffffffffffffffffffffffffffff'

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

    await app.initialize( 0x0, vault.address, { from: accounts[0] })
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
      )).logs[0].args.accountId.toNumber()

      await app.fund(accountId, {
        from: empire,
        value: web3.toWei(0.01, 'ether'),
      })
      supports = [ 500, 200, 300 ]
      totalsupport = 1000
      await token.generateTokens(root, 25e18)
      await token.transfer(vault.address, 25e18)
      const zeros = new Array(candidateAddresses.length).fill(0)
      ethPayoutId = (await app.setDistribution(
        candidateAddresses,
        supports,
        zeros,
        '',
        'ETH description',
        zeros,
        zeros,
        accountId,
        false,
        0,
        web3.toWei(0.01, 'ether'),
        0x0
      )).logs[0].args.payoutId.toNumber()
      tokenPayoutId = (await app.setDistribution(
        candidateAddresses,
        supports,
        zeros,
        '',
        'token description',
        zeros,
        zeros,
        accountId,
        false,
        0,
        25e18,
        token.address
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
      assert.equal(accountMembers[1], 'Fett\'s vett', 'Payout metadata incorrect')
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

    it('retrieves payout info details (eth)', async () => {
      const payoutInfo = await app.getPayout(accountId,ethPayoutId)
      assert.strictEqual(payoutInfo[0].toNumber(), 1e16, 'payout amount incorrect')
      assert.strictEqual(payoutInfo[1], false, 'payout Should not be recurring')
      assert.isAbove(payoutInfo[2].toNumber(), 0, 'recurring payout start time incorrect')
      assert.strictEqual(payoutInfo[3].toNumber(), 0, 'recurring payout period length incorrect')
    })

    it('retrieves payout description', async () =>{
      const payoutDescription = await app.getPayoutDescription(accountId,ethPayoutId)
      assert.strictEqual(payoutDescription, 'ETH description', 'Payout description incorrectly stored')
    })

    it('sets the distribution (token)', async () => {
      const candidateArrayLength = (await app.getNumberOfCandidates(
        accountId,
        tokenPayoutId,
      )).toNumber()
      let storedSupport = []
      let supportVal

      for (let i = 0; i < candidateArrayLength; i++) {
        supportVal = (await app.getPayoutDistributionValue(
          accountId,
          tokenPayoutId,
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

    it('executes the payout (token)', async () => {
      const bobafettBalance = await token.balanceOf(bobafett)
      const dengarBalance = await token.balanceOf(dengar)
      const bosskBalance = await token.balanceOf(bossk)
      assert.equal(
        bobafettBalance.toNumber(),
        BigNumber(25e18).times(supports[0]).div(totalsupport).toNumber(),
        'boba fett token balance inccorrect'
      )
      assert.equal(
        dengarBalance.toNumber(),
        BigNumber(25e18).times(supports[1]).div(totalsupport).toNumber(),
        'dengar token balance inccorrect'
      )
      assert.equal(
        bosskBalance.toNumber(),
        BigNumber(25e18).times(supports[2]).div(totalsupport).toNumber(),
        'bossk token balance inccorrect'
      )
    })

    it('can send eth payouts to other allocations accounts', async () => {
      const account1Info1 = await app.getAccount(accountId)
      accountAddress1 = account1Info1[2]

      accountId2 = (await app.newAccount(
        'Fett\'s new ship',
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
        'description',
        zeros,
        zeros,
        accountId2,
        false,
        0,
        web3.toWei(1.00, 'ether'),
        0x0,
      )).logs[0].args.payoutId.toNumber()

      const account1Info2 = await app.getAccount(accountId)
      assert.strictEqual(
        account1Info2[0].sub(account1Info1[0]).toString(),
        web3.toWei(0.15, 'ether'),
        'account balance difference doesn\'t match transferred amount'
      )

    })

    it('does not transfer tokens to other allocations accounts', async () => {
      const account1Info1 = await app.getAccount(accountId)
      accountAddress1 = account1Info1[2]

      accountId3 = (await app.newAccount(
        'Fett\'s new ship',
      )).logs[0].args.accountId.toNumber()

      await token.generateTokens(root, 25e18)
      await token.transfer(vault.address, 25e18)

      account1Balance1 = await token.balanceOf(account1Info1[2])


      testCandidates = [ ...candidateAddresses, accountAddress1 ]
      supports = [ 500, 200, 150, 150 ]
      totalsupport = 1000
      const zeros = new Array(testCandidates.length).fill(0)
      const payoutId2 = (await app.setDistribution(
        testCandidates,
        supports,
        zeros,
        '',
        '',
        zeros,
        zeros,
        accountId3,
        false,
        0,
        web3.toWei(1.00, 'ether'),
        token.address,
      )).logs[0].args.payoutId.toNumber()

      const account1Info2 = await app.getAccount(accountId)
      assert.strictEqual(
        BigNumber(await token.balanceOf(account1Info2[2]))
          .minus(account1Balance1)
          .toNumber(),
        0,
        'account balance difference doesn\'t match transferred amount'
      )


    })

    it('can fund account via proxy address', async () => {
      const account1Info1 = await app.getAccount(accountId)
      const accountAddress1 = account1Info1[2]
      await web3.eth.sendTransaction({ from: empire, to: accountAddress1, value: web3.toWei(1.00, 'ether'), })
      const account1Info2 = await app.getAccount(accountId)
      assert.strictEqual(
        account1Info2[0].sub(account1Info1[0]).toString(),
        web3.toWei(1.0, 'ether'),
        'account balance difference doesn\'t match transferred amount'
      )
    })

    it('cannot execute more than once if non-recurring', async () => {
      await app.fund(accountId, {
        from: empire,
        value: web3.toWei(1.00, 'ether'),
      })
      return assertRevert(async () => {
        await app.runPayout(accountId, ethPayoutId)
      })
    })

    context('invalid workflows', () => {
      before(async () => {
        accountId = (await app.newAccount(
          'Fett\'s vett',
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
        'Fett\'s auto warranty',
      )).logs[0].args.accountId.toNumber()
    })

    it('cannot occur more frequently than daily', async () => {
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
          '',
          zeros,
          zeros,
          accountId,
          true,
          86300,
          web3.toWei(0.01, 'ether'),
          0x0,
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
        '',
        zeros,
        zeros,
        accountId,
        true,
        86400,
        web3.toWei(0.01, 'ether'),
        0x0
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
