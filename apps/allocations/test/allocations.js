const Allocations = artifacts.require('Allocations')
const DAOFactory = artifacts.require(
  '@tpt/test-helpers/contracts/factory/DAOFactory'
)
const EVMScriptRegistryFactory = artifacts.require(
  '@tpt/test-helpers/contracts/factory/EVMScriptRegistryFactory'
)
const ACL = artifacts.require('@tpt/test-helpers/contracts/acl/ACL')
const Kernel = artifacts.require('@tpt/test-helpers/contracts/kernel/Kernel')

// TODO: Fix Vault not loading artifacts error
// const Vault = artifacts.require('@aragon/apps-vault/contracts/Vault')

const getContract = name => artifacts.require(name)
const createdPayoutId = receipt =>
  receipt.logs.filter(x => x.event == 'StartPayout')[0].args.voteId

const ANY_ADDR = ' 0xffffffffffffffffffffffffffffffffffffffff'

contract('Allocations App', accounts => {
  let daoFact,
    app = {}

  const root = accounts[0]

  before(async () => {
    const kernelBase = await getContract('Kernel').new(true)
    const aclBase = await getContract('ACL').new()
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

    let receipt = await dao.newAppInstance(
      '0x1234',
      (await Allocations.new()).address,
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

    receipt = await dao.newAppInstance(
      '0x2345',
      (await Allocations.new()).address,
      { from: root }
    )

    allocation = Allocations.at(
      receipt.logs.filter(l => l.event == 'NewAppProxy')[0].args.proxy
    )
    const test = await app.initialize({ from: accounts[0] })
  })

  context('app creation and funded Payout', () => {
    const empire = accounts[0]
    const bobafett = accounts[1]
    const dengar = accounts[2]
    const bossk = accounts[3]
    let imperialBudget

    let bobafettInitialBalance
    let dengarInitialBalance
    let bosskInitialBalance
    let allocationId
    let supports

    before(async () => {
      imperialBudget = await web3.eth.getBalance(empire)
      var send = await web3.eth.sendTransaction({
        from: empire,
        to: app.address,
        value: web3.toWei(0.01, 'ether'),
      })
      bobafettInitialBalance = await web3.eth.getBalance(bobafett)
      dengarInitialBalance = await web3.eth.getBalance(dengar)
      bosskInitialBalance = await web3.eth.getBalance(bossk)
      candidateAddresses = [bobafett, dengar, bossk]
    })

    beforeEach(async () => {
      allocationId = (await app.newPayout(
        'Fett\'s vett',
        web3.toWei(1, 'ether'),
        0x0
      )).logs[0].args.accountId.toNumber()

      supports = [500, 200, 300]
      totalsupport = 1000
      await app.setDistribution(
        candidateAddresses,
        supports,
        allocationId,
        false,
        false,
        0,
        web3.toWei(0.01, 'ether'),
        { from: empire }
      )
    })
    // TODO: Split common initial steps into the parent beforeEach Function
    // TODO: Create Assertions for each intermediary step:
    // 1. initialization - Done
    // 2. setDistribution
    // 3. executePayout

    it('app initialized properly', async () => {
      const initBlock = await app.getInitializationBlock()
      assert.isAbove(initBlock,0,'App was not initialized properly')
    })
    
    it('can create a new Payout', async () => {
      payoutMembers = await app.getPayout(allocationId)
      assert.equal(payoutMembers[2], 'Fett\'s vett', 'Payout metadata incorrect')
      assert.equal(payoutMembers[0].toNumber(), 10000000000000000, 'Payout Balance Incorrect')
      assert.equal(payoutMembers[1].toNumber(), 1000000000000000000,'Payout Limit incorrect')
    })

    it('sets the distribution', async () => {
      const candidateArrayLength = (await app.getNumberOfCandidates(allocationId)).toNumber()
      let storedSupport = []
      let supportVal

      for (let i = 0; i < candidateArrayLength; i++) {
        supportVal = (await app.getPayoutDistributionValue(allocationId, i)).toNumber()
        assert.equal(supports[i], supportVal,'support distributions do not match what is specified')
        storedSupport.push(supportVal)
      }
      assert.equal(supports.length, storedSupport.length, 'distribution array lengths do not match')
    })

    it('executes the payout', async () => {
      // TODO: Test does not work, fix


      //await app.executePayout(allocationId)
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
  })

  context('Informational Payout', () => {
    it('can create new Payout')
    it('sets the distribution')
    xit('cannot accept funds', async () => {
      //assertrevert when attempt to add funds
    })
    xit('cannot execute', async () => {
      // assertrevert an attempt to run executePayout for an informational vote
    })
  })

  context('recurring payout', () => {
    xit('cannot occur more frequently than daily', async () => {
      
    })
  })
})
