/* global artifact, ... */
const {
  ACL,
  DAOFactory,
  EVMScriptRegistryFactory,
  Kernel,
  StandardBounties,
  MiniMeToken,
} = require('@tps/test-helpers/artifacts')

const Vault = artifacts.require('Vault')
const Projects = artifacts.require('Projects')

const { assertRevert } = require('@tps/test-helpers/assertThrow')

const addedRepo = receipt =>
  web3.toAscii(receipt.logs.filter(x => x.event == 'RepoAdded')[0].args.repoId)
const addedBounties = receipt =>
  receipt.logs.filter(x => x.event == 'BountyAdded')[2]
const fulfilledBounty = receipt =>
  receipt.logs.filter(x => x.event == 'BountyFulfilled')[0].args

contract('Projects App', accounts => {
  let daoFact,
    bounties,
    app = {},
    vaultBase = {},
    vault = {}

  const root = accounts[0]
  const owner1 = accounts[0] // 0xb421
  const bountyAdder = accounts[2]
  const repoRemover = accounts[3]
  const repoIdString = 'MDEwOIJlcG9zaXRvcnkxNjY3MjlyMjY='
  const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

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
    // read: https://github.com/AutarkLabs/planning-suite/pull/243
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

    // create ACL permissions
    await acl.createPermission(
      owner1,
      app.address,
      await app.ADD_REPO_ROLE(),
      root,
      { from: root }
    )

    await acl.createPermission(
      bountyAdder,
      app.address,
      await app.FUND_ISSUES_ROLE(),
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

    await acl.createPermission(
      root,
      app.address,
      await app.CURATE_ISSUES_ROLE(),
      root,
      { from: root }
    )

    await acl.createPermission(
      bountyAdder,
      app.address,
      await app.REVIEW_APPLICATION_ROLE(),
      root,
      { from: root }
    )

    await acl.createPermission(
      bountyAdder,
      app.address,
      await app.WORK_REVIEW_ROLE(),
      root,
      { from: root }
    )

    await acl.createPermission(
      root,
      app.address,
      await app.CHANGE_SETTINGS_ROLE(),
      root,
      { from: root }
    )

    // Deploy test Bounties contract
    bounties = await StandardBounties.new(web3.toBigNumber(owner1))
    vaultBase = await Vault.new()
    const vaultReceipt = await dao.newAppInstance('0x5678', vaultBase.address, '0x', false, { from: root })
    vault = Vault.at(vaultReceipt.logs.filter(l => l.event == 'NewAppProxy')[0].args.proxy)
    await vault.initialize()
    await acl.createPermission(
      app.address,
      vault.address,
      await vault.TRANSFER_ROLE(),
      root,
      { from: root }
    )

    //bounties = StandardBounties.at(registry.address)

  })

  context('pre-initialization', () => {
    it('will not initialize with invalid vault address', async () =>{
      return assertRevert(async () => {
        await app.initialize(
          bounties.address,
          ZERO_ADDR,
          '',
        )
      })
    })
  })
  context('post-initialization', () => {
    beforeEach(async () =>{
      await app.initialize(bounties.address, vault.address, '')
    })

    context('creating and retrieving repos and bounties', () => {
      let repoId

      beforeEach(async () => {
        repoId = addedRepo(
          await app.addRepo(
            repoIdString, // repoId
            { from: owner1 }
          )
        )
      })

      it('creates a repo id entry', async () => {
        assert.equal(
          repoId,
          repoIdString, // TODO: extract to a variable
          'repo is created and ID is returned'
        )
      })

      it('retrieve repo array length', async () => {
        const repolength = await app.getReposCount()
        assert(repolength, 1, 'valid repo length returned')
      })

      it('retrieve repo information successfully', async () => {
        const repoInfo = await app.getRepo(repoId, { from: owner1 })
        const result = repoInfo // get repo index on the registry
        assert.equal(
          result,
          0, // repoIndex
          'valid repo info returned'
        )
      })

      it('can remove repos', async () => {
        repoId2 = addedRepo(
          await app.addRepo(
            'MDawOlJlcG9zaXRvcnk3NTM5NTIyNA==', // repoId
            { from: owner1 }
          )
        )
        app.removeRepo(repoId, { from: repoRemover })
        app.removeRepo(repoId2, { from: repoRemover })
      })

      context('standard bounty verification tests', () => {
        beforeEach(async () => {
          await bounties.issueBounty(
            accounts[0],
            2528821098,
            'data',
            1000,
            0x0,
            false,
            0x0,
            { from: accounts[0] }
          )
        })

        it('StandardBounties Deployed Correctly', async () => {
          let owner = await bounties.owner()
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
          await bounties.activateBounty(0, 1000, {
            from: accounts[0],
            value: 1000,
          })
          await bounties.fulfillBounty(0, 'data', { from: accounts[1] })
          let fulfillment = await bounties.getFulfillment(0, 0)
          assert(fulfillment[0] === false)
          await bounties.acceptFulfillment(0, 0, { from: accounts[0] })
          fulfillment = await bounties.getFulfillment(0, 0)
          assert(fulfillment[0] === true)
        })

        it('verifies that bounty fulfillment completes', async () => {
          await bounties.issueBounty(
            accounts[0],
            2528821098,
            'data',
            1000,
            0x0,
            false,
            0x0,
            { from: accounts[0] }
          )
          await bounties.activateBounty(0, 1000, {
            from: accounts[0],
            value: 1000,
          })
          await bounties.fulfillBounty(0, 'data', { from: accounts[1] })
          let fulfillment = await bounties.getFulfillment(0, 0)
          assert(fulfillment[0] === false)
          await bounties.acceptFulfillment(0, 0, { from: accounts[0] })
          fulfillment = await bounties.getFulfillment(0, 0)
          const bounty = await bounties.getBounty(0)
          assert(fulfillment[0] === true)
          assert(bounty[5] == 0)
        })

        it('verifies that bounty fulfillment flow works to completion with several fulfillments', async () => {
          await bounties.issueBounty(
            accounts[0],
            2528821098,
            'data',
            1000,
            0x0,
            false,
            0x0,
            { from: accounts[0] }
          )
          await bounties.activateBounty(0, 1000, {
            from: accounts[0],
            value: 1000,
          })
          await bounties.fulfillBounty(0, 'data', { from: accounts[1] })
          await bounties.fulfillBounty(0, 'data2', { from: accounts[2] })
          let fulfillment = await bounties.getFulfillment(0, 0)
          assert(fulfillment[0] === false)
          await bounties.acceptFulfillment(0, 0, { from: accounts[0] })
          fulfillment = await bounties.getFulfillment(0, 0)
          const bounty = await bounties.getBounty(0)
          assert(fulfillment[0] === true)
          assert(bounty[5] == 0)
        })
      })

      context('issue, fulfill, and accept fulfillment for ETH bounties', () => {
        let issue3Receipt
        const issueNumber = 1

        beforeEach('issue bulk bounties', async () => {
          issue3Receipt = addedBounties(
            await app.addBounties(
              Array(3).fill(repoId),
              [ 1, 2, 3 ],
              [ 10, 20, 30 ],
              [ Date.now() + 86400, Date.now() + 86400, Date.now() + 86400 ],
              [ false, false, false ],
              [ 0, 0, 0 ],
              'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDCQmVtYjNij3KeyGmcgg7yVXWskLaBtov3UYL9pgcGK3MCWuQmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w',
              'something',
              { from: bountyAdder, value: 60 }
            )
          )
        })

        it('verifies bounty data contains correct IPFS hashes', async () => {
          const issue3Bounty = issue3Receipt.args.bountySize.toNumber()
          assert.strictEqual(issue3Bounty, 30, 'bounty not added')
          const IssueData1 = await app.getIssue(repoId, 1)
          const bountyId1 = IssueData1[1].toNumber()
          const bountyData1 = await bounties.getBountyData(bountyId1)
          assert.strictEqual(
            bountyData1,
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDC',
            'IPFS hash stored correctly'
          )
          const IssueData2 = await app.getIssue(repoId, 2)
          const bountyId2 = IssueData2[1].toNumber()
          const bountyData2 = await bounties.getBountyData(bountyId2)
          assert.strictEqual(
            bountyData2,
            'QmVtYjNij3KeyGmcgg7yVXWskLaBtov3UYL9pgcGK3MCWu',
            'IPFS hash stored correctly'
          )
          const IssueData3 = await app.getIssue(repoId, 3)
          const bountyId3 = IssueData3[1].toNumber()
          const bountyData3 = await bounties.getBountyData(bountyId3)
          assert.strictEqual(
            bountyData3,
            'QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w',
            'IPFS hash stored correctly'
          )
        })

        it('allows users to request assignment', async () => {
          await app.requestAssignment(
            repoId,
            issueNumber,
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDd',
            { from: root }
          )
          response = await app.getApplicant(repoId, issueNumber, 0)
          assert.strictEqual(response[0], root, 'applicant address incorrect')
          assert.strictEqual(
            response[1],
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDd',
            'application IPFS hash incorrect'
          )
        })

        it('users cannot apply for a given issue more than once', async () => {
          await app.requestAssignment(
            repoId,
            issueNumber,
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDd',
            { from: root }
          )
          assertRevert(async () => {
            await app.requestAssignment(
              repoId,
              issueNumber,
              'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDd',
              { from: root }
            )
          })
        })

        it('cannot approve assignment if application was not created', async () => {
          return assertRevert(async () => {
            await app.reviewApplication(
              repoId,
              issueNumber,
              ZERO_ADDR,
              'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDe',
              true,
              { from: bountyAdder }
            )
          })
        })

        it('assign tasks to applicants', async () => {
          await app.requestAssignment(
            repoId,
            issueNumber,
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDd',
            { from: root }
          )
          applicantQty = await app.getApplicantsLength(repoId, 1)
          applicant = await app.getApplicant(
            repoId,
            issueNumber,
            applicantQty.toNumber() - 1
          )
          await app.reviewApplication(
            repoId,
            issueNumber,
            applicant[0],
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDe',
            true,
            { from: bountyAdder }
          )

          const issue = await app.getIssue(repoId, 1)
          assert.strictEqual(issue[6], root, 'assignee address incorrect')
        })

        it('approve and reject assignment request', async () => {
          await app.requestAssignment(
            repoId,
            issueNumber,
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDd',
            { from: root }
          )
          applicantQty = await app.getApplicantsLength(repoId, 1)
          applicant = await app.getApplicant(
            repoId,
            issueNumber,
            applicantQty.toNumber() - 1
          )
          assert.strictEqual(
            applicant[2].toNumber(),
            0,
            'assignment request status is not Unreviewed'
          )

          await app.reviewApplication(
            repoId,
            issueNumber,
            applicant[0],
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDe',
            true,
            { from: bountyAdder }
          )
          applicant = await app.getApplicant(
            repoId,
            issueNumber,
            applicantQty.toNumber() - 1
          )
          assert.strictEqual(
            applicant[2].toNumber(),
            1,
            'assignment request status is not Accepted'
          )

          await app.reviewApplication(
            repoId,
            issueNumber,
            applicant[0],
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDe',
            false,
            { from: bountyAdder }
          )
          applicant = await app.getApplicant(
            repoId,
            issueNumber,
            applicantQty.toNumber() - 1
          )
          assert.strictEqual(
            applicant[2].toNumber(),
            2,
            'assignment request status is not Rejected'
          )
        })

        it('users can submit work', async () => {
          await app.requestAssignment(
            repoId,
            issueNumber,
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDd',
            { from: root }
          )
          applicantQty = await app.getApplicantsLength(repoId, 1)
          applicant = await app.getApplicant(
            repoId,
            issueNumber,
            applicantQty.toNumber() - 1
          )
          await app.reviewApplication(
            repoId,
            issueNumber,
            applicant[0],
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDe',
            true,
            { from: bountyAdder }
          )

          await app.submitWork(
            repoId,
            issueNumber,
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDk'
          )
          submissionQty = await app.getSubmissionsLength(repoId, issueNumber)
          submission = await app.getSubmission(
            repoId,
            issueNumber,
            submissionQty.toNumber() - 1
          )
          assert.strictEqual(
            submission[0],
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDk',
            'submission incorrect'
          )
        })

        it('work can be rejected', async () => {
          await app.requestAssignment(
            repoId,
            issueNumber,
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDd',
            { from: root }
          )
          applicantQty = await app.getApplicantsLength(repoId, 1)
          applicant = await app.getApplicant(
            repoId,
            issueNumber,
            applicantQty.toNumber() - 1
          )
          await app.reviewApplication(
            repoId,
            issueNumber,
            applicant[0],
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDe',
            true,
            { from: bountyAdder }
          )

          await app.submitWork(
            repoId,
            issueNumber,
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDk'
          )
          submissionQty = await app.getSubmissionsLength(repoId, issueNumber)
          const submissionIndex = submissionQty.toNumber() - 1
          submission = await app.getSubmission(
            repoId,
            issueNumber,
            submissionIndex
          )

          await app.reviewSubmission(
            repoId,
            issueNumber,
            submissionIndex,
            false,
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDl',
            { from: bountyAdder }
          )
          submission = await app.getSubmission(
            repoId,
            issueNumber,
            submissionIndex
          )
          assert.strictEqual(
            submission[2].toNumber(),
            2,
            'submission status not rejected'
          )
        })

        it('work can be accepted', async () => {
          await app.requestAssignment(
            repoId,
            issueNumber,
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDd',
            { from: root }
          )
          applicantQty = await app.getApplicantsLength(repoId, 1)
          applicant = await app.getApplicant(
            repoId,
            issueNumber,
            applicantQty.toNumber() - 1
          )
          await app.reviewApplication(
            repoId,
            issueNumber,
            applicant[0],
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDe',
            true,
            { from: bountyAdder }
          )

          await app.submitWork(
            repoId,
            issueNumber,
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDk'
          )
          submissionQty = await app.getSubmissionsLength(repoId, issueNumber)
          const submissionIndex = submissionQty.toNumber() - 1
          submission = await app.getSubmission(
            repoId,
            issueNumber,
            submissionIndex
          )

          await app.reviewSubmission(
            repoId,
            issueNumber,
            submissionIndex,
            true,
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDl',
            { from: bountyAdder }
          )
          submission = await app.getSubmission(
            repoId,
            issueNumber,
            submissionIndex
          )
          assert.strictEqual(
            submission[2].toNumber(),
            1,
            'submission status not accepted'
          )
        })

        it('work cannot be accepted twice', async () => {
          await app.requestAssignment(
            repoId,
            issueNumber,
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDd',
            { from: root }
          )
          applicantQty = await app.getApplicantsLength(repoId, 1)
          applicant = await app.getApplicant(
            repoId,
            issueNumber,
            applicantQty.toNumber() - 1
          )
          await app.reviewApplication(
            repoId,
            issueNumber,
            applicant[0],
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDe',
            true,
            { from: bountyAdder }
          )

          await app.submitWork(
            repoId,
            issueNumber,
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDk'
          )
          submissionQty = await app.getSubmissionsLength(repoId, issueNumber)
          const submissionIndex = submissionQty.toNumber() - 1
          submission = await app.getSubmission(
            repoId,
            issueNumber,
            submissionIndex
          )

          await app.reviewSubmission(
            repoId,
            issueNumber,
            submissionIndex,
            true,
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDl',
            { from: bountyAdder }
          )

          return assertRevert(async () => {
            await app.reviewSubmission(
              repoId,
              issueNumber,
              submissionIndex,
              true,
              'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDl',
              { from: bountyAdder }
            )
          })
        })

        it('users cannot submit work for an issue they are not assigned to', async () => {
          assertRevert(async () => {
            await app.submitWork(
              repoId,
              issueNumber,
              'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDk'
            )
          })
        })

        it('work cannot be accepted or submitted after bounty is fulfilled', async () => {
          await app.requestAssignment(
            repoId,
            issueNumber,
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDd',
            { from: root }
          )
          applicantQty = await app.getApplicantsLength(repoId, 1)
          applicant = await app.getApplicant(
            repoId,
            issueNumber,
            applicantQty.toNumber() - 1
          )
          await app.reviewApplication(
            repoId,
            issueNumber,
            applicant[0],
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDe',
            true,
            { from: bountyAdder }
          )

          await app.submitWork(
            repoId,
            issueNumber,
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDk'
          )
          submissionQty = await app.getSubmissionsLength(repoId, issueNumber)
          const submissionIndex = submissionQty.toNumber() - 1
          submission = await app.getSubmission(
            repoId,
            issueNumber,
            submissionIndex
          )

          await app.reviewSubmission(
            repoId,
            issueNumber,
            submissionIndex,
            true,
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDl',
            { from: bountyAdder }
          )
          assertRevert(async () => {
            await app.submitWork(
              repoId,
              issueNumber,
              'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDk'
            )
          })
          assertRevert(async () => {
            await app.reviewSubmission(
              repoId,
              issueNumber,
              submissionIndex,
              true,
              { from: bountyAdder }
            )
          })
        })

        xit('fulfill bounties and accept fulfillment', async () => {
          const IssueData1 = await app.getIssue(repoId, 1)
          const bountyId1 = IssueData1[1].toNumber()
          const fulfillmentId1 = fulfilledBounty(
            await bounties.fulfillBounty(bountyId1, 'findthemillenniumfalcon')
          )._fulfillmentId.toNumber()
          let fulfillment1 = await bounties.getFulfillment(
            bountyId1,
            fulfillmentId1
          )
          assert(fulfillment1[0] === false)
          await app.acceptFulfillment(repoId, 1, fulfillmentId1, {
            from: bountyAdder,
          })
          fulfillment1 = await bounties.getFulfillment(bountyId1, fulfillmentId1)
          assert(fulfillment1[0] === true)

          const IssueData2 = await app.getIssue(repoId, 2)
          const bountyId2 = IssueData2[1].toNumber()
          const fulfillmentId2 = fulfilledBounty(
            await bounties.fulfillBounty(bountyId2, 'findthemillenniumfalcon')
          )._fulfillmentId.toNumber()
          let fulfillment2 = await bounties.getFulfillment(
            bountyId2,
            fulfillmentId2
          )
          assert(fulfillment2[0] === false)
          await app.acceptFulfillment(repoId, 2, fulfillmentId2, {
            from: bountyAdder,
          })
          fulfillment2 = await bounties.getFulfillment(bountyId2, fulfillmentId2)
          assert(fulfillment2[0] === true)

          const IssueData3 = await app.getIssue(repoId, 3)
          const bountyId3 = IssueData3[1].toNumber()
          const fulfillmentId3 = fulfilledBounty(
            await bounties.fulfillBounty(bountyId3, 'findthemillenniumfalcon')
          )._fulfillmentId.toNumber()
          let fulfillment3 = await bounties.getFulfillment(
            bountyId3,
            fulfillmentId3
          )
          assert(fulfillment3[0] === false)
          await app.acceptFulfillment(repoId, 3, fulfillmentId3, {
            from: bountyAdder,
          })
          fulfillment3 = await bounties.getFulfillment(bountyId3, fulfillmentId3)
          assert(fulfillment3[0] === true)
        })

        xit('verify balance is correct before and after accepting fulfillment in standard bounty', async () => {
          const IssueData1 = await app.getIssue(repoId, 1)
          const bountyId1 = IssueData1[1].toNumber()
          const fulfillmentId1 = fulfilledBounty(
            await bounties.fulfillBounty(bountyId1, 'findthemillenniumfalcon')
          )._fulfillmentId.toNumber()
          let fulfillment1 = await bounties.getFulfillment(
            bountyId1,
            fulfillmentId1
          )
          assert(fulfillment1[0] === false)
          let bounty1 = await bounties.getBounty(bountyId1)
          assert.strictEqual(bounty1[5].toNumber(), 10)
          await app.acceptFulfillment(repoId, 1, fulfillmentId1, {
            from: bountyAdder,
          })
          fulfillment1 = await bounties.getFulfillment(bountyId1, fulfillmentId1)
          assert(fulfillment1[0] === true)
          bounty1 = await bounties.getBounty(bountyId1)
          assert.strictEqual(bounty1[5].toNumber(), 0)

          const IssueData2 = await app.getIssue(repoId, 2)
          const bountyId2 = IssueData2[1].toNumber()
          const fulfillmentId2 = fulfilledBounty(
            await bounties.fulfillBounty(bountyId2, 'findthemillenniumfalcon')
          )._fulfillmentId.toNumber()
          let fulfillment2 = await bounties.getFulfillment(
            bountyId2,
            fulfillmentId2
          )
          assert(fulfillment2[0] === false)
          let bounty2 = await bounties.getBounty(bountyId2)
          assert.strictEqual(bounty2[5].toNumber(), 20)
          await app.acceptFulfillment(repoId, 2, fulfillmentId2, {
            from: bountyAdder,
          })
          fulfillment2 = await bounties.getFulfillment(bountyId2, fulfillmentId2)
          assert(fulfillment2[0] === true)
          bounty2 = await bounties.getBounty(bountyId2)
          assert.strictEqual(bounty2[5].toNumber(), 0)

          const IssueData3 = await app.getIssue(repoId, 3)
          const bountyId3 = IssueData3[1].toNumber()
          const fulfillmentId3 = fulfilledBounty(
            await bounties.fulfillBounty(bountyId3, 'findthemillenniumfalcon')
          )._fulfillmentId.toNumber()
          let fulfillment3 = await bounties.getFulfillment(
            bountyId3,
            fulfillmentId3
          )
          assert(fulfillment3[0] === false)
          let bounty3 = await bounties.getBounty(bountyId3)
          assert.strictEqual(bounty3[5].toNumber(), 30)
          await app.acceptFulfillment(repoId, 3, fulfillmentId3, {
            from: bountyAdder,
          })
          fulfillment3 = await bounties.getFulfillment(bountyId3, fulfillmentId3)
          assert(fulfillment3[0] === true)
          bounty3 = await bounties.getBounty(bountyId3)
          assert.strictEqual(bounty3[5].toNumber(), 0)
        })

        it('can issue bulk token bounties', async () => {
          const issueNumber = 1
          let issue3Receipt
          let token = {}

          token = await MiniMeToken.new(
            ZERO_ADDR,
            ZERO_ADDR,
            0,
            'n',
            0,
            'n',
            true
          ) // empty parameters minime
          await token.generateTokens(vault.address, 6)
          issue3Receipt = addedBounties(
            await app.addBounties(
              Array(3).fill(repoId),
              [ 1, 2, 3 ],
              [ 1, 2, 3 ],
              [ Date.now() + 86400, Date.now() + 86400, Date.now() + 86400 ],
              [ true, true, true ],
              [ token.address, token.address, token.address ],
              'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDCQmVtYjNij3KeyGmcgg7yVXWskLaBtov3UYL9pgcGK3MCWuQmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w',
              'something',
              { from: bountyAdder, }
            )
          )

          const issue3Bounty = issue3Receipt.args.bountySize.toNumber()
          assert.strictEqual(issue3Bounty, 3, 'bounty not added')
          const IssueData1 = await app.getIssue(repoId, 1)
          const bountyId1 = IssueData1[1].toNumber()
          const bountyData1 = await bounties.getBountyData(bountyId1)
          assert.strictEqual(
            bountyData1,
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDC',
            'IPFS hash stored correctly'
          )
          const IssueData2 = await app.getIssue(repoId, 2)
          const bountyId2 = IssueData2[1].toNumber()
          const bountyData2 = await bounties.getBountyData(bountyId2)
          assert.strictEqual(
            bountyData2,
            'QmVtYjNij3KeyGmcgg7yVXWskLaBtov3UYL9pgcGK3MCWu',
            'IPFS hash stored correctly'
          )
          const IssueData3 = await app.getIssue(repoId, 3)
          const bountyId3 = IssueData3[1].toNumber()
          const bountyData3 = await bounties.getBountyData(bountyId3)
          assert.strictEqual(
            bountyData3,
            'QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w',
            'IPFS hash stored correctly'
          )
        })
      })
    })

    context('issue curation', () => {
    // TODO: We should create every permission for every test this way to speed up testing
    // TODO: Create an external helper function that inits acl and sets permissions
      before(async () => {})
      it('should curate a multiple issues', async () => {
        const unusedAddresses = accounts.slice(0, 4)
        const zeros = new Array(unusedAddresses.length).fill(0)
        const issuePriorities = zeros
        const issueDescriptionIndices = zeros
        const unused_issueDescriptions = ''
        const issueRepos = zeros
        const issueNumbers = zeros
        const unused_curationId = 0
        const description = 'description'
        await app.curateIssues(
          unusedAddresses,
          issuePriorities,
          issueDescriptionIndices,
          unused_issueDescriptions,
          description,
          issueRepos,
          issueNumbers,
          unused_curationId
        )
      // assert()
      })
      context('invalid issue curation operations', () => {
        it('should revert on issueDescriptionindices and priorities array length mismatch', async () => {
          const unusedAddresses = accounts.slice(0, 4)
          const zeros = new Array(unusedAddresses.length).fill(0)
          const issuePriorities = zeros
          const issueDescriptionIndices = zeros.slice(0, 3)
          const unused_issueDescriptions = ''
          const issueRepos = zeros
          const issueNumbers = zeros
          const unused_curationId = 0
          const description = 'description'
          assertRevert(async () => {
            await app.curateIssues(
              unusedAddresses,
              issuePriorities,
              issueDescriptionIndices,
              unused_issueDescriptions,
              description,
              issueRepos,
              issueNumbers,
              unused_curationId
            )
          })
        })
        it('should revert on IssuedescriptionIndices and issueRepos array length mismatch', async () => {
          const unusedAddresses = accounts.slice(0, 4)
          const zeros = new Array(unusedAddresses.length).fill(0)
          const issuePriorities = zeros
          const issueDescriptionIndices = zeros
          const unused_issueDescriptions = ''
          const issueRepos = zeros.slice(0, 3)
          const issueNumbers = zeros
          const unused_curationId = 0
          const description = 'description'
          assertRevert(async () => {
            await app.curateIssues(
              unusedAddresses,
              issuePriorities,
              issueDescriptionIndices,
              unused_issueDescriptions,
              description,
              issueRepos,
              issueNumbers,
              unused_curationId
            )
          })
        })
        it('should revert on IssueRepos and IssuesNumbers array length mismatch', async () => {
          const unusedAddresses = accounts.slice(0, 4)
          const zeros = new Array(unusedAddresses.length).fill(0)
          const issuePriorities = zeros
          const issueDescriptionIndices = zeros
          const unused_issueDescriptions = ''
          const issueRepos = zeros
          const issueNumbers = zeros.slice(0, 3)
          const unused_curationId = 0
          const description = 'description'
          assertRevert(async () => {
            await app.curateIssues(
              unusedAddresses,
              issuePriorities,
              issueDescriptionIndices,
              unused_issueDescriptions,
              description,
              issueRepos,
              issueNumbers,
              unused_curationId
            )
          })
        })
        xit('should revert if an issue has an already assigned bounty', async () => {
        // assert()
        })
      })
    })

    context('settings management', () => {
      it('cannot accept experience arrays of differenct length', async () => {
        return assertRevert( async () => {
          await app.changeBountySettings(
            [ 100, 300, 500, 1000 ], // xp multipliers
            [
            // Experience Levels
              web3.fromAscii('Beginner'),
              web3.fromAscii('Intermediate'),
              web3.fromAscii('Advanced'),
            ],
            1, // baseRate
            336, // bountyDeadline
            ZERO_ADDR, // bountyCurrency
            bounties.address // bountyAllocator
          //0x0000000000000000000000000000000000000000  //bountyArbiter
          )
        })
      })
      it('can change Bounty Settings', async () => {
        await app.changeBountySettings(
          [ 100, 300, 500, 1000 ], // xp multipliers
          [
          // Experience Levels
            web3.fromAscii('Beginner'),
            web3.fromAscii('Intermediate'),
            web3.fromAscii('Advanced'),
            web3.fromAscii('Expert'),
          ],
          1, // baseRate
          336, // bountyDeadline
          ZERO_ADDR, // bountyCurrency
          bounties.address // bountyAllocator
        //0x0000000000000000000000000000000000000000  //bountyArbiter
        )

        response = await app.getSettings()

        expect(response[0].map(x => x.toNumber())).to.have.ordered.members([
          100,
          300,
          500,
          1000,
        ])
        const xpLvlDescs = response[1].map(x => web3.toUtf8(x))
        expect(xpLvlDescs).to.have.ordered.members([
          'Beginner',
          'Intermediate',
          'Advanced',
          'Expert',
        ])

        assert.strictEqual(response[2].toNumber(), 1, 'baseRate Incorrect')
        assert.strictEqual(
          response[3].toNumber(),
          336,
          'bounty deadline inccorrect'
        )
        assert.strictEqual(
          response[4],
          '0x0000000000000000000000000000000000000000',
          'Token Address incorrect'
        )
        assert.strictEqual(
          response[5],
          bounties.address,
          'StandardBounties Contract address incorrect'
        )
      //assert.strictEqual(
      //  response[5],
      //  '0x0000000000000000000000000000000000000000',
      //  'arbiter incorrect'
      //)
      })
    })

    context('invalid operations', () => {
      it('cannot add a repo that is already present', async () => {
        await app.addRepo('abc', { from: owner1 })

        assertRevert(async () => {
          await app.addRepo('abc', { from: owner1 })
        })
      })
      it('cannot remove a repo that was never added', async () => {
        assertRevert(async () => {
          await app.removeRepo('99999', { from: repoRemover })
        })
      })
      it('cannot retrieve a removed Repo', async () => {
        const repoId = addedRepo(
          await app.addRepo('abc', { from: owner1 })
        )
        await app.removeRepo(repoId, { from: repoRemover })
        // const result = await app.getRepo(repoId)
        assertRevert(async () => {
          await app.getRepo(repoId, { from: repoRemover })
        })
      // assert.equal(
      //   web3.toAscii(result[0]).replace(/\0/g, ''),
      //   '',
      //   'repo returned'
      // )
      })

      // TODO: Cannot remove a not existing repo
      // TODO: settings tests

      it('cannot add bounties to unregistered repos', async () => {
        assertRevert(async () => {
          await app.addBounties(
            Array(3).fill('0xdeadbeef'),
            [ 1, 2, 3 ],
            [ 10, 20, 30 ],
            'something cool',
            {
              from: bountyAdder,
            }
          )
        })
      })

      xit('cannot accept unfulfilled bounties', async () => {
        let repoId = addedRepo(
          await app.addRepo(
            'MDEyOk9yZ2FuaXphdGlvbjM0MDE4MzU5',
            { from: owner1 }
          )
        )
        await app.addBounties(
          Array(3).fill(repoId),
          [ 1, 2, 3 ],
          [ 10, 20, 30 ],
          [ Date.now() + 86400, Date.now() + 86400, Date.now() + 86400 ],
          [ false, false, false ],
          [ 0, 0, 0 ],
          'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDCQmVtYjNij3KeyGmcgg7yVXWskLaBtov3UYL9pgcGK3MCWuQmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w',
          'something else',
          { from: bountyAdder, value: 60 }
        )
        assertRevert(async () => {
          await app.acceptFulfillment(repoId, 0, 0, { from: bountyAdder })
        })
        await bounties.fulfillBounty(0, 'findthemillenniumfalcon')
        let fulfillment1 = await bounties.getFulfillment(0, 0)
        assert(fulfillment1[0] === false)
        await app.acceptFulfillment(repoId, 0, 0, { from: bountyAdder })
        fulfillment1 = await bounties.getFulfillment(0, 0)
        assert(fulfillment1[0] === true)
      })

      xit('cannot issue bulk bounties with mismatched values', async () => {
        const bountyAdder = accounts[2]
        const repoId = addedRepo(
          await app.addRepo('abc', { from: owner1 })
        )
        assertRevert(async () => {
          await app.addBounties(
            Array(3).fill(repoId),
            [ 1, 2, 3 ],
            [ 10, 20, 30 ], // 60 total Wei should be sent
            [ Date.now() + 86400, Date.now() + 86400, Date.now() + 86400 ],
            [ false, false, false ],
            [ 0, 0, 0 ],
            'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDCQmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDCQmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDC',
            'something awesome',
            { from: bountyAdder, value: 61 } // 61 Wei sent instead
          )
        })
      })
    })
  })
})
