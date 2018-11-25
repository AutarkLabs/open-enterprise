/* global artifact, ... */
const {
  ACL,
  DAOFactory,
  EVMScriptRegistryFactory,
  Kernel,
  StandardBounties
} = require('@tps/test-helpers/artifacts')

const Projects = artifacts.require('Projects')

const { assertRevert } = require('@tps/test-helpers/assertThrow')

const addedRepo = receipt => receipt.logs.filter(
  x => x.event == 'RepoAdded')[0].args.repoId
const addedBounties = receipt => receipt.logs.filter(
  x => x.event == 'BountyAdded')[2]
const acceptedFulfillment = receipt => receipt.logs.filter(
  x => x.event == 'FulfillmentAccepted')

contract('Projects App', accounts => {
  let daoFact,
    registry,
    app = {}

  const root = accounts[0]
  const owner1 = accounts[0]
  const owner2 = accounts[1]
  const bountyAdder = accounts[2]
  const repoRemover = accounts[4]

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
    //Deploy Base DAO Contracts
    const r = await daoFact.newDAO(root)
    const dao = Kernel.at(
      r.logs.filter(l => l.event == 'DeployDAO')[0].args.dao
    )

    const acl = ACL.at(await dao.acl())

    //Create DAO admin role
    await acl.createPermission(
      root,
      dao.address,
      await dao.APP_MANAGER_ROLE(),
      root,
      { from: root }
    )

    //Deploy Contract to be tested
    // TODO: Revert to use regular function call when truffle gets updated
    // read: https://github.com/spacedecentral/planning-suite/pull/243
    let receipt = await dao.newAppInstance(
      '0x1234',
      (await Projects.new()).address,
      0x0,
      false,
      { from: root }
    )
    app = Projects.at(
      receipt.logs.filter(l => l.event == 'NewAppProxy')[0].args.proxy
    )

    //create ACL permissions
    await acl.createPermission(
      owner1,
      app.address,
      await app.ADD_REPO_ROLE(),
      root,
      { from: root }
    )
    await acl.grantPermission(owner2, app.address, await app.ADD_REPO_ROLE(), {
      from: root,
    })
    await acl.createPermission(
      bountyAdder,
      app.address,
      await app.ADD_BOUNTY_ROLE(),
      root,
      { from: root }
    )
    await acl.createPermission(
      repoRemover,
      app.address,
      await app.REMOVE_REPO_ROLE(),
      root,
      { from: root }
    )

    // Deploy test Bounties contract
    registry = await StandardBounties.new(web3.toBigNumber(owner1))
    bounties = StandardBounties.at(registry.address)

    await app.initialize(registry.address)
  })

  context('creating and retrieving repos and bounties', function () {
    it('creates a repo id entry', async function () {
      const repoID = addedRepo(
        await app.addRepo(
          'MDEyOk9yZ2FuaXphdGlvbjM0MDE4MzU5',
          'MDEwOlJlcG9zaXRvcnkxMTYyNzE4MDk='
        )
      )
      assert.equal(
        repoID,
        '0xd1f2b806d3ffc90a501a7c22dbbcbb3f1f14e136cd9da208dc0b6e6b0f64b777',
        'repo is created and hashed ID is returned'
      )
    })

    it('retrieves repo information successfully', async function () {
      const owner1 = accounts[0]
      const repoID = addedRepo(
        await app.addRepo(
          'MDEyOk9yZ2FuaXphdGlvbjM0MDE4MzU5',
          'MDEwOlJlcG9zaXRvcnkxMTYyNzE4MDk='
        )
      )
      const repoInfo = await app.getRepo(repoID, { from: owner1 })
      const result = web3.toAscii(repoInfo[0])

      // result = repoInfo[0]
      assert.equal(
        result,
        'MDEyOk9yZ2FuaXphdGlvbjM0MDE4MzU5',
        'invalid repo info returned'
      )
    })

    it('accepts bounties and adds them to StandardBounties.sol', async function () {
      const bountyAdder = accounts[2]
      const repoID = addedRepo(
        await app.addRepo('abc', String(123))
      )
      const issue3Receipt = addedBounties(
        await app.addBounties(
          repoID,
          [1, 2, 3],
          [10, 20, 30],
          [86400, 86400, 86400],
          [false, false, false],
          [0, 0, 0],
          'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDCQmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDCQmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDC',
          { from: bountyAdder, value: 60 }
        )
      )
      const issue3Bounty = issue3Receipt.args.bountySize.toNumber()
      assert.strictEqual(issue3Bounty, 30, 'bounty not added')
      const IssueData1 = await app.getIssue(repoID, 1)
      const bountyId1 = IssueData1[1].toNumber()
      const bountyData1 = await bounties.getBountyData(bountyId1)
      assert.strictEqual(bountyData1, 'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDC', 'IPFS hash stored incorrectly')
      const IssueData2 = await app.getIssue(repoID, 2)
      const bountyId2 = IssueData2[1].toNumber()
      const bountyData2 = await bounties.getBountyData(bountyId2)
      assert.strictEqual(bountyData2, 'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDC', 'IPFS hash stored incorrectly')
      const IssueData3 = await app.getIssue(repoID, 3)
      const bountyId3 = IssueData3[1].toNumber()
      const bountyData3 = await bounties.getBountyData(bountyId3)
      assert.strictEqual(bountyData3, 'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDC', 'IPFS hash stored incorrectly')
    })

    context('standard bounty verification tests', function () {
      beforeEach(async () => {
        await bounties.issueBounty(accounts[0],
          2528821098,
          'data',
          1000,
          0x0,
          false,
          0x0,
          { from: accounts[0] }
        )
      })

      it('verifies that the StandardBounties registry works', async () => {
        let owner = await registry.owner()
        assert(owner == accounts[0])
      })

      it('verifies that simple bounty contribution and activation functions', async () => {
        await bounties.contribute(0, 1000, { from: accounts[0], value: 1000 })
        let bounty = await bounties.getBounty(0)
        assert(bounty[4] == 0)
        await bounties.activateBounty(0, 0, { from: accounts[0] })
        bounty = await bounties.getBounty(0)
        assert(bounty[4] == 1)
      })

      it('verifies that basic fulfillment acceptance flow works', async () => {
        await registry.activateBounty(0, 1000, { from: accounts[0], value: 1000 })
        await registry.fulfillBounty(0, 'data', { from: accounts[1] })
        let fulfillment = await registry.getFulfillment(0, 0)
        assert(fulfillment[0] === false)
        await registry.acceptFulfillment(0, 0, { from: accounts[0] })
        fulfillment = await registry.getFulfillment(0, 0)
        assert(fulfillment[0] === true)
      })
    })

    context('fulfill bounty & accept fulfillment', function () {
      beforeEach(async () => {
        const bountyAdder = accounts[2]
        const repoID = addedRepo(
          await app.addRepo('abc', String(123))
        )
        await app.addBounties(
          repoID,
          [1, 2, 3],
          [10, 20, 30],
          [86400, 86400, 86400],
          [false, false, false],
          [0, 0, 0],
          'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDCQmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDCQmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDC',
          { from: bountyAdder, value: 60 }
        )
      })

      xit('accepts fulfillment', async function () {
        await app.fulfillBounty(0, 'findthemillenniumfalcon')
        let result = acceptedFulfillment(
          await app.acceptFulfillment(repoID, 1, 0, { from: root })
        )
        // TODO: debug vm exception
      })

      // TODO: add state checks for standard bounty contract,
      // such that it reflects state changes made in projects contract
    })

    // TODO: add state checks for standard bounty contract,
    // such that it reflects state changes made in projects contract
  })

  context('invalid operations', function () {
    it('cannot retrieve a removed Repo', async function () {
      const repoID = addedRepo(
        await app.addRepo('abc', String(123))
      )
      await app.removeRepo(repoID, { from: repoRemover })
      const result = await app.getRepo(repoID)
      assert.equal(
        web3.toAscii(result[0]).replace(/\0/g, ''),
        '',
        'repo returned'
      )
    })

    it('cannot add bounties to unregistered repos', async function () {
      assertRevert(async () => {
        await app.addBounties('0xdeadbeef', [1, 2, 3], [10, 20, 30], {
          from: bountyAdder,
        })
      })
    })


    it('addBounties reverts when value sent is incorrect', async function () {
      const bountyAdder = accounts[2]
      const repoID = addedRepo(
        await app.addRepo('abc', String(123))
      )
      assertRevert(async () => {
        await app.addBounties(
          repoID,
          [1, 2, 3],
          [10, 20, 30],                   // 60 total Wei should be sent
          [86400, 86400, 86400],
          [false, false, false],
          [0, 0, 0],
          'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDCQmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDCQmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDC',
          { from: bountyAdder, value: 61 }  // 61 Wei sent instead
        )
      })
    })

  })
})
