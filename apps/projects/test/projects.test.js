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

contract('Projects App', accounts => {
  let daoFact,
    bountiesBase,
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
    // Deploy test Bounties contract
    bountiesBase = await StandardBounties.new(web3.toBigNumber(owner1))
    bounties = StandardBounties.at(bountiesBase.address)
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

    await app.initialize(bountiesBase.address)
  })

  context('creating and retrieving repos and bounties', function () {
    it('creates a repo id entry', async function () {
      repoID = (await app.addRepo(
        'MDEyOk9yZ2FuaXphdGlvbjM0MDE4MzU5',
        'MDEwOlJlcG9zaXRvcnkxMTYyNzE4MDk='
      )).logs.filter(x => x.event == 'RepoAdded')[0].args.id
      assert.equal(
        repoID,
        '0xd1f2b806d3ffc90a501a7c22dbbcbb3f1f14e136cd9da208dc0b6e6b0f64b777',
        'repo is created and hashed ID is returned'
      )
    })

    it('retrieves repo information successfully', async function () {
      const owner1 = accounts[0]
      repoID = (await app.addRepo(
        'MDEyOk9yZ2FuaXphdGlvbjM0MDE4MzU5',
        'MDEwOlJlcG9zaXRvcnkxMTYyNzE4MDk='
      )).logs.filter(x => x.event == 'RepoAdded')[0].args.id
      repoInfo = await app.getRepo(repoID, { from: owner1 })
      result = web3.toAscii(repoInfo[0])

      // result = repoInfo[0]
      assert.equal(
        result,
        'MDEyOk9yZ2FuaXphdGlvbjM0MDE4MzU5',
        'invalid repo info returned'
      )
    })

    it('accepts bounties and adds them to StandardBounties.sol', async function () {
      const bountyAdder = accounts[2]
      repoID = (await app.addRepo('abc', String(123))).logs.filter(
        x => x.event == 'RepoAdded'
      )[0].args.id
      issue3Receipt = (await app.addBounties(
        repoID,
        [1, 2, 3],
        [10, 20, 30],
        [86400, 86400, 86400],
        [false, false, false],
        [0, 0, 0],
        'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDCQmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDCQmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDC',
        { from: bountyAdder, value: 60 }
      )).logs.filter(x => x.event == 'BountyAdded')[2]
      issue3Bounty = issue3Receipt.args.bountySize.toNumber()
      assert.strictEqual(issue3Bounty, 30, 'bounty not added')
      IssueData = await app.getIssue(repoID, 1)
      bountyID = IssueData[1].toNumber()
      result = await bounties.getBountyData(bountyID)
      assert.strictEqual(result, 'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDC', 'IPFS hash stored incorrectly')

      //TODO Add validations for all other data entered for a bounty
    })

    xit('fulfills bounty', async function () {
      //TODO Add test for fulfillBounty
    })

    xit('accepts fulfillment', async function () {
      //TODO Add test for acceptFulfillment
    })

    //TODO topocount to test minimum bound of bounties that can be accepted
  })

  context('invalid operations', function () {
    it('cannot retrieve a removed Repo', async function () {
      repoID = (await app.addRepo('abc', String(123))).logs.filter(
        x => x.event == 'RepoAdded'
      )[0].args.id
      await app.removeRepo(repoID, { from: repoRemover })
      result = await app.getRepo(repoID)
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
      repoID = (await app.addRepo('abc', String(123))).logs.filter(
        x => x.event == 'RepoAdded'
      )[0].args.id
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
