/* global artifacts, assert, before, beforeEach, contract, context, expect, it, web3 */

const { assertRevert } = require('@aragon/test-helpers/assertThrow')
const truffleAssert = require('truffle-assertions')

/** Helper function to import truffle contract artifacts */
const getContract = name => artifacts.require(name)

/** Helper function to read events from receipts */
const getReceipt = (receipt, event, arg) => receipt.logs.filter(l => l.event === event)[0].args[arg]


/** Useful constants */
const repoIdString = 'MDEwOIJlcG9zaXRvcnkxNjY3MjlyMjY='
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
const ANY_ADDR = '0xffffffffffffffffffffffffffffffffffffffff'
const bountyHash1 = 'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDC'
const bountyHash2 = 'QmVtYjNij3KeyGmcgg7yVXWskLaBtov3UYL9pgcGK3MCWu'
const bountyHash3 = 'QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w'
const requestHash = 'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDd'
const reviewHash  = 'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDe'
const reviewHash2 = 'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDl'
const updateHash  = 'QmbUSy8HCn8J4TMDRRdxCbK2uCCtkQyZtY6XYv3y7kLgDm'
const invalidHash = 'QmbUSy8HCn8J4TMD'

const addedRepo = receipt =>
  web3.toAscii(receipt.logs.filter(x => x.event === 'RepoAdded')[0].args.repoId)
//const addedBounties = receipt =>
//  receipt.logs.filter(x => x.event === 'BountyAdded')[2]
const addedBountyInfo = receipt =>
  receipt.logs.filter(x => x.event === 'IssueUpdated').map(event => event.args)
//const fulfilledBounty = receipt =>
//  receipt.logs.filter(x => x.event === 'BountyFulfilled')[0].args

contract('Projects App', accounts => {
  let APP_MANAGER_ROLE, ADD_REPO_ROLE, CHANGE_SETTINGS_ROLE, CURATE_ISSUES_ROLE, CREATE_ISSUES_ROLE
  let FUND_ISSUES_ROLE, FUND_OPEN_ISSUES_ROLE, REMOVE_ISSUES_ROLE, REMOVE_REPO_ROLE
  let REVIEW_APPLICATION_ROLE, TRANSFER_ROLE, UPDATE_BOUNTIES_ROLE, WORK_REVIEW_ROLE
  let daoFact, alternateBounties, bounties, bountiesEvents, app, vaultBase, vault
  let dao, acl, appBase

  // Setup test actor accounts
  const [ root, bountyManager, repoRemover ] = accounts

  before(async () => {
    //Create Base DAO Contracts
    const kernelBase = await getContract('Kernel').new(true) // petrify immediately
    const aclBase = await getContract('ACL').new()
    const regFact = await getContract('EVMScriptRegistryFactory').new()
    daoFact = await getContract('DAOFactory').new(
      kernelBase.address,
      aclBase.address,
      regFact.address
    )

    appBase = await getContract('Projects').new()
    vaultBase = await getContract('Vault').new()

    // Setup ACL roles constants
    APP_MANAGER_ROLE = await kernelBase.APP_MANAGER_ROLE()
    ADD_REPO_ROLE = await appBase.ADD_REPO_ROLE()
    CHANGE_SETTINGS_ROLE = await appBase.CHANGE_SETTINGS_ROLE()
    CREATE_ISSUES_ROLE = await appBase.CREATE_ISSUES_ROLE()
    CURATE_ISSUES_ROLE = await appBase.CURATE_ISSUES_ROLE()
    FUND_ISSUES_ROLE = await appBase.FUND_ISSUES_ROLE()
    FUND_OPEN_ISSUES_ROLE = await appBase.FUND_OPEN_ISSUES_ROLE()
    REMOVE_ISSUES_ROLE = await appBase.REMOVE_ISSUES_ROLE()
    REMOVE_REPO_ROLE = await appBase.REMOVE_REPO_ROLE()
    REVIEW_APPLICATION_ROLE = await appBase.REVIEW_APPLICATION_ROLE()
    TRANSFER_ROLE = await vaultBase.TRANSFER_ROLE()
    UPDATE_BOUNTIES_ROLE = await appBase.UPDATE_BOUNTIES_ROLE()
    WORK_REVIEW_ROLE = await appBase.WORK_REVIEW_ROLE()

    /** Create the dao from the dao factory */
    const daoReceipt = await daoFact.newDAO(root)
    dao = getContract('Kernel').at(getReceipt(daoReceipt, 'DeployDAO', 'dao'))

    /** Setup permission to install app */
    acl = getContract('ACL').at(await dao.acl())
    await acl.createPermission(root, dao.address, APP_MANAGER_ROLE, root)

    /** Install a vault instance to the dao */
    const vaultReceipt = await dao.newAppInstance('0x5678', vaultBase.address, '0x', false)
    vault = getContract('Vault').at(getReceipt(vaultReceipt, 'NewAppProxy', 'proxy'))
    await vault.initialize()
    await acl.createPermission(root, vault.address, TRANSFER_ROLE, root)
  })

  beforeEach(async () => {
    /** Install an app instance to the dao */
    const appReceipt = await dao.newAppInstance('0x1234', appBase.address, '0x', false)
    app = getContract('Projects').at(getReceipt(appReceipt, 'NewAppProxy', 'proxy'))

    /** Setup permission to create rewards */
    await acl.createPermission(bountyManager, app.address, FUND_ISSUES_ROLE, root)
    await acl.createPermission(bountyManager, app.address, FUND_OPEN_ISSUES_ROLE, root)
    await acl.createPermission(bountyManager, app.address, REMOVE_ISSUES_ROLE, root)
    await acl.createPermission(bountyManager, app.address, REVIEW_APPLICATION_ROLE, root)
    await acl.createPermission(bountyManager, app.address, UPDATE_BOUNTIES_ROLE, root)
    await acl.createPermission(bountyManager, app.address, WORK_REVIEW_ROLE, root)
    await acl.createPermission(repoRemover, app.address, REMOVE_REPO_ROLE, root)
    await acl.createPermission(root, app.address, ADD_REPO_ROLE, root)
    await acl.createPermission(root, app.address, CURATE_ISSUES_ROLE, root)
    await acl.createPermission(root, app.address, CHANGE_SETTINGS_ROLE, root)
    await acl.createPermission(ANY_ADDR, app.address, CREATE_ISSUES_ROLE, root)

    /** Setup permission to transfer funds */
    await acl.grantPermission(app.address, vault.address, TRANSFER_ROLE)

    // implement bountiesEvents so the events are logged by Truffle
    // console.log('Bounties Addresses: ', process.env.BOUNTY_ADDR.split(' '))
    // Create mock Bounties contract object
    // This address is generated using the seed phrase in the test command
    bounties = { address: '0x72D1Ae1D6C8f3dd444b3D95bAd554Be483082e40'.toLowerCase() }
    alternateBounties = { address: '0xDAaA2f5fbF606dEfa793984bd3615c909B1a3C93'.toLowerCase() }
    bountiesEvents = getContract('BountiesEvents').at('0x72D1Ae1D6C8f3dd444b3D95bAd554Be483082e40')
    //bounties = StandardBounties.at(registry.address)
  })

  context('pre-initialization', () => {
    it('will not initialize with invalid vault address', async () => {
      return assertRevert(async () => {
        await app.initialize(
          bounties.address,
          ZERO_ADDR,
        )
      })
    })

    it('will not initialize with invalid bounties address', async () => {
      return assertRevert(async () => {
        await app.initialize(
          ZERO_ADDR,
          vault.address,
        )
      })
    })
  })

  context('post-initialization', () => {
    beforeEach(async () => {
      await app.initialize(bounties.address, vault.address)
    })

    context('creating and retrieving repos and bounties', () => {
      let repoId

      beforeEach(async () => {
        repoId = addedRepo(
          await app.setRepo(
            repoIdString, // repoId
            false,
            '',
            { from: root }
          )
        )
      })

      it('creates a repo id entry', async () => {
        assert.equal(
          repoId,
          repoIdString, // TODO: extract to a variable
          'repo is created and ID is returned'
        )
        assert.isTrue(await app.isRepoAdded(repoId), 'repo should have been removed')
      })

      it('retrieve repo array length', async () => {
        const repolength = await app.getReposCount()
        assert(repolength, 1, 'valid repo length returned')
      })

      it('retrieve repo information successfully', async () => {
        const repoInfo = await app.getRepo(repoId, { from: root })
        const result = repoInfo // get repo index on the registry
        assert.equal(
          result[0],
          0, // repoIndex
          'valid repo info returned'
        )
        assert.equal(
          result[1],
          0, // open Issues
          'valid repo info returned'
        )
      })

      it('can remove repos', async () => {
        let repoId2 = addedRepo(
          await app.setRepo(
            'MDawOlJlcG9zaXRvcnk3NTM5NTIyNA==', // repoId
            false,
            '',
            { from: root }
          )
        )
        let repoId3 = addedRepo(
          await app.setRepo(
            'DRawOlJlcG9zaXRvcnk3NTM5NTIyNA==', // repoId,
            false,
            '',
            { from: root }
          )
        )
        await app.removeRepo(repoId3, { from: repoRemover })
        assert.isFalse(await app.isRepoAdded(repoId3), 'repo at end of array should have been removed')
        assert.isTrue(await app.isRepoAdded(repoId2), 'repo2 should still be accessible')

        repoId3 = addedRepo(
          await app.setRepo(
            'DRawOlJlcG9zaXRvcnk3NTM5NTIyNA==', // repoId,
            false,
            '',
            { from: root }
          )
        )
        await app.removeRepo(repoId2, { from: repoRemover })
        assert.isFalse(await app.isRepoAdded(repoId2), 'repo at in the middle of the array should have been removed')
        assert.isTrue(await app.isRepoAdded(repoId3), 'repo3 should still be accessible')

        repoId2 = addedRepo(
          await app.setRepo(
            'MDawOlJlcG9zaXRvcnk3NTM5NTIyNA==', // repoId
            false,
            '',
            { from: root }
          )
        )
        await app.removeRepo(repoId, { from: repoRemover })
        assert.isFalse(await app.isRepoAdded(repoId), 'repo in the middle of the array should have been removed')
        assert.isTrue(await app.isRepoAdded(repoId2), 'repo2 should still be accessible')
      })

      context('issue, fulfill, and accept fulfillment for bounties', () => {
        let issueReceipt
        const issueNumber = 1

        context('successfully fulfill bounties', () => {
          beforeEach('issue bulk bounties', async () => {
            issueReceipt = addedBountyInfo(
              await app.addBounties(
                Array(3).fill(repoId),
                [ 1, 2, 3 ],
                [ 10, 20, 30 ],
                [ Date.now() + 86400, Date.now() + 86400, Date.now() + 86400 ],
                [ 0, 0, 0 ],
                [ 0, 0, 0 ],
                bountyHash1 + bountyHash2 + bountyHash3,
                'something',
                { from: bountyManager, value: 60 }
              )
            )
          })

          it('verifies bounty data contains correct details in emitted event and contract state', async () => {
            issueReceipt.forEach((bounty, index) => {
              assert.deepInclude(
                bounty,
                {
                  repoId: '0x4d4445774f494a6c6347397a61585276636e6b784e6a59334d6a6c794d6a593d',
                  issueNumber: new web3.BigNumber(index + 1),
                  bountySize: new web3.BigNumber((index + 1) * 10),
                  registryId: new web3.BigNumber(index)
                }
              )
            })
            const issueNumbers = issueReceipt.map(bounty => bounty.issueNumber)
            const issueData1 = await app.getIssue(repoId, issueNumbers[0])
            assert.deepEqual(
              issueData1,
              [
                new web3.BigNumber(0),
                new web3.BigNumber(0),
                new web3.BigNumber(10),
                ZERO_ADDR,
                bountyHash1
              ]
            )
            const issueData2 = await app.getIssue(repoId, issueNumbers[1])
            assert.deepEqual(
              issueData2,
              [
                new web3.BigNumber(1),
                new web3.BigNumber(0),
                new web3.BigNumber(20),
                ZERO_ADDR,
                bountyHash2
              ]
            )
            const issueData3 = await app.getIssue(repoId, issueNumbers[2])
            assert.deepEqual(
              issueData3,
              [
                new web3.BigNumber(2),
                new web3.BigNumber(0),
                new web3.BigNumber(30),
                ZERO_ADDR,
                bountyHash3
              ]
            )
          })

          it('can update bounty information', async () => {
            await app.updateBounty(
              repoId,
              issueNumber,
              'example data',
              Date.now() + 96400,
              'example description',
              { from: bountyManager }
            )
          })

          it('allows users to request assignment', async () => {
            await app.requestAssignment(
              repoId,
              issueNumber,
              requestHash,
              { from: root }
            )
            const response = await app.getApplicant(repoId, issueNumber, 0)
            assert.strictEqual(response[0], root, 'applicant address incorrect')
            assert.strictEqual(
              response[1],
              requestHash,
              'application IPFS hash incorrect'
            )
          })

          it('users cannot apply for a given issue more than once', async () => {
            await app.requestAssignment(
              repoId,
              issueNumber,
              requestHash,
              { from: root }
            )
            assertRevert(async () => {
              await app.requestAssignment(
                repoId,
                issueNumber,
                requestHash,
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
                reviewHash,
                true,
                { from: bountyManager }
              )
            })
          })

          it('assign tasks to applicants', async () => {
            await app.requestAssignment(
              repoId,
              issueNumber,
              requestHash,
              { from: root }
            )
            const applicantQty = await app.getApplicantsLength(repoId, 1)
            const applicant = await app.getApplicant(
              repoId,
              issueNumber,
              applicantQty.toNumber() - 1
            )
            await app.reviewApplication(
              repoId,
              issueNumber,
              applicant[0],
              reviewHash,
              true,
              { from: bountyManager }
            )

            const issue = await app.getIssue(repoId, 1)
            assert.strictEqual(issue[3], root, 'assignee address incorrect')
          })

          it('approve and reject assignment request', async () => {
            await app.requestAssignment(
              repoId,
              issueNumber,
              requestHash,
              { from: root }
            )
            const applicantQty = await app.getApplicantsLength(repoId, 1)
            let applicant = await app.getApplicant(
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
              reviewHash,
              true,
              { from: bountyManager }
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
              reviewHash,
              false,
              { from: bountyManager }
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

          it('work can be rejected', async () => {
            const bountyId = (await app.getIssue(repoId, issueNumber))[0].toString()
            //console.log(bountyId)
            await app.requestAssignment(
              repoId,
              issueNumber,
              requestHash,
              { from: root }
            )
            const applicantQty = await app.getApplicantsLength(repoId, 1)
            const applicant = await app.getApplicant(
              repoId,
              issueNumber,
              applicantQty.toNumber() - 1
            )
            await app.reviewApplication(
              repoId,
              issueNumber,
              applicant[0],
              reviewHash,
              true,
              { from: bountyManager }
            )

            await bountiesEvents.fulfillBounty(root, bountyId, [root], 'test')

            await app.reviewSubmission(
              repoId,
              issueNumber,
              0,
              false,
              reviewHash2,
              [0],
              { from: bountyManager }
            )
            //assert(false, 'show events')
          })

          it('work can be accepted', async () => {
            await app.requestAssignment(
              repoId,
              issueNumber,
              requestHash,
              { from: root }
            )
            const applicantQty = await app.getApplicantsLength(repoId, 1)
            const applicant = await app.getApplicant(
              repoId,
              issueNumber,
              applicantQty.toNumber() - 1
            )
            await app.reviewApplication(
              repoId,
              issueNumber,
              applicant[0],
              reviewHash,
              true,
              { from: bountyManager }
            )
            const bountyId = (await app.getIssue(repoId, issueNumber))[0].toString()
            //console.log(bountyId)
            await bountiesEvents.fulfillBounty(root, bountyId, [root], 'test')

            await app.reviewSubmission(
              repoId,
              issueNumber,
              0,
              true,
              reviewHash2,
              [10],
              { from: bountyManager }
            )
            //assert(false, 'log events')
          })

          it('cannot fulfill unused issue', async () => {
            return assertRevert( async () => {
              await app.reviewSubmission(
                repoId,
                9999,
                0,
                true,
                reviewHash2,
                [10],
                { from: bountyManager }
              )
            })
          })

          it('work cannot be accepted twice', async () => {
            await app.requestAssignment(
              repoId,
              issueNumber,
              requestHash,
              { from: root }
            )
            const applicantQty = await app.getApplicantsLength(repoId, 1)
            const applicant = await app.getApplicant(
              repoId,
              issueNumber,
              applicantQty.toNumber() - 1
            )
            await app.reviewApplication(
              repoId,
              issueNumber,
              applicant[0],
              reviewHash,
              true,
              { from: bountyManager }
            )
            const bountyId = (await app.getIssue(repoId, issueNumber))[0].toString()
            //console.log(bountyId)
            await bountiesEvents.fulfillBounty(root, bountyId, [root], 'test')

            await app.reviewSubmission(
              repoId,
              issueNumber,
              0,
              true,
              reviewHash2,
              [10],
              { from: bountyManager }
            )

            return assertRevert(async () => {
              await app.reviewSubmission(
                repoId,
                issueNumber,
                0,
                true,
                reviewHash2,
                [10],
                { from: bountyManager }
              )
            })
          })

          it('can issue bulk token bounties', async () => {
            let token = {}

            token = await getContract('MiniMeToken').new(
              ZERO_ADDR,
              ZERO_ADDR,
              0,
              'n',
              0,
              'n',
              true
            ) // empty parameters minime
            await token.generateTokens(vault.address, 6)
            issueReceipt = await addedBountyInfo(
              await app.addBounties(
                Array(3).fill(repoId),
                [ 4, 5, 6 ],
                [ 1, 2, 3 ],
                [ Date.now() + 86400, Date.now() + 86400, Date.now() + 86400 ],
                [ 20, 20, 20 ],
                [ token.address, token.address, token.address ],
                bountyHash1 + bountyHash2 + bountyHash3,
                'something',
                { from: bountyManager, }
              )
            )
            issueReceipt.forEach((bounty, index) => {
              assert.deepInclude(
                bounty,
                {
                  repoId: '0x4d4445774f494a6c6347397a61585276636e6b784e6a59334d6a6c794d6a593d',
                  issueNumber: new web3.BigNumber(index + 4),
                  bountySize: new web3.BigNumber(index + 1),
                  registryId: new web3.BigNumber(bounty.registryId)
                }
              )
              assert.isAbove(Number(bounty.registryId), 0, 'a non-zero bounty Id should be returned from standard bounties')
            })
          })

          it('can issue bulk ETH bounties from the vault', async () => {
            await vault.deposit(0, 6, { value: 6 })
            issueReceipt = await addedBountyInfo(
              await app.addBounties(
                Array(3).fill(repoId),
                [ 7, 8, 9 ],
                [ 1, 2, 3 ],
                [ Date.now() + 86400, Date.now() + 86400, Date.now() + 86400 ],
                Array(3).fill(1),
                Array(3).fill(0),
                bountyHash1 + bountyHash2 + bountyHash3,
                'something',
                { from: bountyManager, }
              )
            )
            issueReceipt.forEach((bounty, index) => {
              assert.deepInclude(
                bounty,
                {
                  repoId: '0x4d4445774f494a6c6347397a61585276636e6b784e6a59334d6a6c794d6a593d',
                  issueNumber: new web3.BigNumber(index + 7),
                  bountySize: new web3.BigNumber(index + 1),
                  registryId: new web3.BigNumber(bounty.registryId)
                }
              )
              assert.isAbove(Number(bounty.registryId), 0, 'a non-zero bounty Id should be returned from standard bounties')
            })
          })
        })

        context('fail to issue or fullfill', () => {
          it('fails to request assignment - issue has no bounty', async () => {
            assertRevert(async () => {
              await app.requestAssignment(
                repoId,
                issueNumber,
                requestHash,
                { from: root }
              )
            })

            return assertRevert(async () => {
              await app.updateBounty(
                repoId,
                issueNumber,
                updateHash,
                Date.now() + 86400,
                'Update',
                { from: bountyManager }
              )
            })
          })

          it('fails to add bounties - incorrect hash', async () => {
            return assertRevert(async () => {
              await app.addBounties(
                Array(1).fill(repoId),
                [issueNumber],
                [10],
                [Date.now() + 86400],
                [0],
                [0],
                invalidHash,
                'something',
                { from: bountyManager, value: 60 }
              )
            })
          })

          it('fails to add bounties - incorrect repo', async () => {
            return assertRevert(async () => {
              await app.addBounties(
                Array(1).fill(0x0),
                [issueNumber],
                [10],
                [Date.now() + 86400],
                [0],
                [0],
                requestHash,
                'something',
                { from: bountyManager, value: 60 }
              )
            })
          })

          it('fails to request assignment - open bounty', async () => {
            await app.addBountiesNoAssignment(
              Array(1).fill(repoId),
              [issueNumber],
              [10],
              [Date.now() + 86400],
              [0],
              [0],
              requestHash,
              'something',
              { from: bountyManager, value: 60 }
            )

            return assertRevert(async () => {
              await app.requestAssignment(
                repoId,
                issueNumber,
                requestHash,
                { from: root }
              )
            })
          })

          it('fail to apply, issue already fulfilled', async () => {
            await app.addBounties(
              Array(1).fill(repoId),
              [issueNumber],
              [10],
              [Date.now() + 86400],
              [0],
              [0],
              requestHash,
              'something',
              { from: bountyManager, value: 60 }
            )

            assertRevert(async () => {
              await app.addBounties(
                Array(1).fill(repoId),
                [issueNumber],
                [10],
                [Date.now() + 86400],
                [0],
                [0],
                requestHash,
                'something',
                { from: bountyManager, value: 60 }
              )
            })

            await app.requestAssignment(
              repoId,
              issueNumber,
              requestHash,
              { from: root }
            )

            await app.reviewApplication(
              repoId,
              issueNumber,
              root,
              reviewHash,
              true,
              { from: bountyManager }
            )
            const bountyId = (await app.getIssue(repoId, issueNumber))[0].toString()
            await bountiesEvents.fulfillBounty(root, bountyId, [root], 'test')

            await app.reviewSubmission(
              repoId,
              issueNumber,
              0,
              true,
              reviewHash2,
              [10],
              { from: bountyManager }
            )

            assertRevert(async () => {
              await app.requestAssignment(
                repoId,
                issueNumber,
                reviewHash2,
                { from: root }
              )
            })

            assertRevert(async () => {
              await app.updateBounty(
                repoId,
                issueNumber,
                updateHash,
                Date.now() + 86400,
                'Update',
                { from: bountyManager }
              )
            })
          })
        })
      })

      context('issue open bounties', () => {
        let issueReceipt

        beforeEach('issue bulk bounties', async () => {
          issueReceipt = addedBountyInfo(
            await app.addBountiesNoAssignment(
              Array(3).fill(repoId),
              [ 1, 2, 3 ],
              [ 10, 20, 30 ],
              [ Date.now() + 86400, Date.now() + 86400, Date.now() + 86400 ],
              [ 0, 0, 0 ],
              [ 0, 0, 0 ],
              bountyHash1 + bountyHash2 + bountyHash3,
              'something',
              { from: bountyManager, value: 60 }
            )
          )
        })

        it('verifies bounty data contains correct details in emitted event and contract state', async () => {
          issueReceipt.forEach((bounty, index) => {
            assert.deepInclude(
              bounty,
              {
                repoId: '0x4d4445774f494a6c6347397a61585276636e6b784e6a59334d6a6c794d6a593d',
                issueNumber: new web3.BigNumber(index + 1),
                bountySize: new web3.BigNumber((index + 1) * 10),
                registryId: new web3.BigNumber(bounty.registryId)
              }
            )
          })
        })

        it('cannot assign an open bounty', async () => {
          return assertRevert(async () => {
            await app.reviewApplication(
              repoId,
              1,
              0,
              reviewHash,
              true,
              { from: bountyManager }
            )
          })
        })

        it('cannot remove repo with pending bounties', async () => {
          return assertRevert(async () => {
            await app.removeRepo(repoId, { from: repoRemover })
          })
        })

        it('work can be accepted multiple times', async () => {
          const bountyId = (await app.getIssue(repoId, 1))[0].toString()
          //console.log(bountyId)
          await bountiesEvents.contribute(root, bountyId, 5, { value: 5 })
          await bountiesEvents.fulfillBounty(root, bountyId, [root], 'test')
          await bountiesEvents.fulfillBounty(bountyManager, bountyId, [bountyManager], 'test2', { from: bountyManager })
          await app.reviewSubmission(
            repoId,
            1,
            0,
            true,
            reviewHash2,
            [9],
            { from: bountyManager }
          )

          await app.reviewSubmission(
            repoId,
            1,
            1,
            true,
            reviewHash2,
            [6],
            { from: bountyManager }
          )
          
          const bounty1 = await app.getIssue(repoId, 1)
          assert.deepEqual(
            bounty1,
            [ 
              new web3.BigNumber(56),
              new web3.BigNumber(15),
              new web3.BigNumber(0),
              ANY_ADDR,
              bountyHash1 
            ]
          )

        })
      })

      context('bounty killing', async () => {

        it('Bounty Properties are reset on issues with killed bounties', async () => {
          const issueNumber = 6
          await app.addBounties(
            [repoId],
            [issueNumber],
            [10],
            [Date.now() + 86400],
            [0],
            [0],
            bountyHash1,
            'test description',
            { from: bountyManager, value: 10 }
          )
          const liveIssue = await app.getIssue(repoId, issueNumber)
          let liveBountySize = liveIssue[2]
          assert.equal(10, liveBountySize.toNumber())
          await app.removeBounties(
            [repoId],
            [issueNumber],
            'test removal',
            { from: bountyManager }
          )
          const deadIssue = await app.getIssue(repoId, issueNumber)
          const bountySize = deadIssue[2]
          assert.equal(0, bountySize.toNumber())
          //assert(false, 'log events')
        })

        it('ETH refund appears in the vault', async () => {
          const issueNumber = 6
          const initialBalance = web3.eth.getBalance(vault.address)
          await app.addBounties(
            [repoId],
            [issueNumber],
            [10],
            [Date.now() + 86400],
            [0],
            [0],
            bountyHash1,
            'test description',
            { from: bountyManager, value: 10 }
          )
          const liveIssue = await app.getIssue(repoId, issueNumber)
          let bountySize = liveIssue[2]
          assert.equal(10, bountySize)
          await app.removeBounties(
            [repoId],
            [issueNumber],
            'test removal',
            { from: bountyManager }
          )

          const finalBalance = web3.eth.getBalance(vault.address)
          assert.strictEqual(finalBalance.sub(initialBalance).toNumber(), 10)

        })

        it('refunds tokens to vault', async () => {
          let token = {}

          token = await getContract('MiniMeToken').new(
            ZERO_ADDR,
            ZERO_ADDR,
            0,
            'n',
            0,
            'n',
            true
          ) // empty parameters minime
          await token.generateTokens(vault.address, 5)
          const issueNumber = 1
          const initialBalance = (await vault.balance(token.address)).toString()
          await addedBountyInfo(
            await app.addBounties(
              [repoId],
              [issueNumber],
              [5],
              [Date.now() + 86400],
              [20],
              [token.address],
              bountyHash1,
              'something',
              { from: bountyManager, }
            )
          )
          const liveIssue = await app.getIssue(repoId, issueNumber)
          let bountySize = liveIssue[2]
          assert.equal(5, bountySize)
          await app.removeBounties(
            [repoId],
            [issueNumber],
            'test removal',
            { from: bountyManager }
          )
          const finalBalance = (await vault.balance(token.address)).toString()
          assert.strictEqual(finalBalance, initialBalance)
        })

        it('bounty doesn\'t exist', async () => {
          await truffleAssert.fails(
            app.removeBounties([repoId], [1], 'reasons', { from: bountyManager }),
            truffleAssert.ErrorType.REVERT)
        })

        it('the repo array length can\'t exceed 256 in length', async () => {
          await truffleAssert.fails(
            app.removeBounties(
              Array(256).fill(repoId),
              Array(256).fill(6),
              'reasons',
              { from: bountyManager }),
            truffleAssert.ErrorType.REVERT,
            // 'LENGTH_EXCEEDED'
          )
        })

        it('the issue array length can\'t exceed 256 in length', async () => {
          await truffleAssert.fails(
            app.removeBounties(
              [ repoId, repoId ],
              Array(256).fill(6),
              'reasons',
              { from: bountyManager }),
            truffleAssert.ErrorType.REVERT,
            // 'LENGTH_EXCEEDED'
          )
        })

        it('the array arguments must have the same length', async () => {
          const issueNumbers = [ 6, 7 ]
          const bountySizes = [ web3.toWei(1), web3.toWei(2) ]
          const value = web3.toWei(3)
          await app.addBounties(
            [ repoId, repoId ],
            issueNumbers, bountySizes,
            [ Date.now() + 86400, Date.now() + 86400 ],
            [ 0, 0 ],
            [ 0, 0 ],
            bountyHash1 + bountyHash2,
            'test description', { from: bountyManager, value: value })
          await truffleAssert.fails(
            app.removeBounties([ repoId, repoId ], [6], 'reasons', { from: bountyManager }),
            truffleAssert.ErrorType.REVERT,
            // 'LENGTH_MISMATCH'
          )
        })

        it('can\'t kill a bounty twice', async () => {
          const issueNumber = 6
          await app.addBounties(
            [repoId],
            [issueNumber],
            [10],
            [Date.now() + 86400],
            [0],
            [0],
            bountyHash1,
            'test description', { from: bountyManager, value: 10 })
          await app.removeBounties([repoId], [issueNumber], 'reasons', {
            from: bountyManager
          })
          await truffleAssert.fails(
            app.removeBounties([repoId], [issueNumber], 'reasons', { from: bountyManager }),
            truffleAssert.ErrorType.REVERT,
            // 'BOUNTY_REMOVED'
          )
        })

        it('can\'t kill a bounty that doesn\'t exist', async () => {
          const issueNumber = 6
          return assertRevert(async () => {
            await app.removeBounties([repoId], [issueNumber], 'reasons', { from: bountyManager })
          })
        })

        it('can\'t kill a fulfilled bounty', async () => {
          const issueNumber = 6
          await app.addBounties(
            [repoId],
            [issueNumber],
            [10],
            [Date.now() + 86400],
            [0],
            [0],
            bountyHash1,
            'test description', { from: bountyManager, value: 10 })
          await app.requestAssignment(
            repoId,
            issueNumber,
            requestHash,
            { from: root }
          )
          const applicantQty = await app.getApplicantsLength(repoId, issueNumber)
          const applicant = await app.getApplicant(
            repoId,
            issueNumber,
            applicantQty.toNumber() - 1
          )
          await app.reviewApplication(
            repoId,
            issueNumber,
            applicant[0],
            reviewHash,
            true,
            { from: bountyManager }
          )
          const bountyId = (await app.getIssue(repoId, issueNumber))[0].toString()
          //console.log(bountyId)
          await bountiesEvents.fulfillBounty(root, bountyId, [root], 'test')

          await app.reviewSubmission(
            repoId,
            issueNumber,
            0,
            true,
            reviewHash2,
            [10],
            { from: bountyManager }
          )
          await truffleAssert.fails(
            app.removeBounties([repoId], [issueNumber], 'reasons', { from: bountyManager }),
            truffleAssert.ErrorType.REVERT,
            // 'BOUNTY_FULFILLED'
          )
        })

        it('cannot create bounties with ERC 721 tokens', async () => {
          const issueNumber = 7
          return assertRevert(async () => {
            await app.addBounties(
              [repoId],
              [issueNumber],
              [5],
              [Date.now() + 86400],
              [721],
              [0],
              bountyHash1,
              'something',
              { from: bountyManager, }
            )
          })
        })

        it('cannot create bounties with token type 0 and a non-zero token address', async () => {
          const issueNumber = 7
          return assertRevert(async () => {
            await app.addBounties(
              [repoId],
              [issueNumber],
              [5],
              [Date.now() + 86400],
              [1],
              [1],
              bountyHash1,
              'something',
              { from: bountyManager, }
            )
          })
        })
        it('cannot create bounties with token type 1 and a non-zero token address', async () => {
          const issueNumber = 7
          return assertRevert(async () => {
            await app.addBounties(
              [repoId],
              [issueNumber],
              [5],
              [Date.now() + 86400],
              [0],
              [1],
              bountyHash1,
              'something',
              { from: bountyManager, }
            )
          })
        })
      })
    })

    context('decoupled project', () => {
      let repoId
      beforeEach(async () => {
        await app.setRepo('1', true, 'abc')
        repoId = '1'
      })
      it('can add a decoupled Project', async () => {
        const projectInfo = await app.getRepo('1')

        assert.deepEqual(
          projectInfo,
          [ 
            new web3.BigNumber(0),
            new web3.BigNumber(0),
            true,
            'abc'
          ]
        )
      })
      it('can remove a decoupled Project', async () => {
        await app.removeRepo('1', { from: repoRemover })
        await truffleAssert.fails(
          app.getRepo('1'),
          truffleAssert.ErrorType.REVERT,
          //'REPO_NOT_ADDED'
        )
      })

      it('can log and update issues for the project', async () => {
        await app.setIssue(
          repoId,
          1,
          'doesn\'t work'
        )

        let issue = await app.getIssue(repoId, 1)
        assert.deepEqual(
          issue,
          [
            new web3.BigNumber(0),
            new web3.BigNumber(0),
            new web3.BigNumber(0),
            ZERO_ADDR,
            'doesn\'t work'
          ]
        )

        await app.setIssue(
          repoId,
          1,
          'doesn\'t work; let\'s get this fixed'
        )

        issue = await app.getIssue(repoId, 1)
        assert.deepEqual(
          issue,
          [
            new web3.BigNumber(0),
            new web3.BigNumber(0),
            new web3.BigNumber(0),
            ZERO_ADDR,
            'doesn\'t work; let\'s get this fixed'
          ]
        )
      })


      it('can log bounty against existing issue', async () => {
        await app.setIssue(
          repoId,
          1,
          'doesn\'t work; let\'s get this fixed'
        )
        await app.addBounties(
          [repoId],
          [1],
          [1],
          [Date.now() + 86400],
          [0],
          [0],
          bountyHash1,
          'adding project to existing issue',
          { from: bountyManager, value: 1 }
        )

        let issue = await app.getIssue(repoId, 1)
        assert.deepEqual(
          issue,
          [
            new web3.BigNumber(66),
            new web3.BigNumber(0),
            new web3.BigNumber(1),
            ZERO_ADDR,
            bountyHash1
          ]
        )
      })

      it('can update projects details', async () => {
        await app.setRepo('1', true, 'abc123')

        const projectInfo = await app.getRepo('1')

        assert.deepEqual(
          projectInfo,
          [ 
            new web3.BigNumber(0),
            new web3.BigNumber(0),
            true,
            'abc123'
          ]
        )
      })

    })

    context('issue curation', () => {
      // TODO: We should create every permission for every test this way to speed up testing
      // TODO: Create an external helper function that inits acl and sets permissions
      before(async () => { })
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
        it('reverts on calling fulfillBounty', async () => {
          assertRevert(async () => {
            await app.fulfillBounty(
              root,
              0,
              [root],
              ''
            )
          })
        })
      })
    })

    context('settings management', () => {
      it('cannot accept experience arrays of differenct length', async () => {
        return assertRevert(async () => {
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
        )

        const response = await app.getSettings()

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
          ZERO_ADDR,
          'Token Address incorrect'
        )
        assert.strictEqual(
          response[5],
          bounties.address,
          'StandardBounties Contract address incorrect'
        )
      })

      it('cannot update bounties contract with a 0x0 address', async () => {
        return assertRevert(async () => {
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
            0 // bountyAllocator
          )
        })
      })

      it('can update bounties contract with a new valid contract instance', async () => {
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
          alternateBounties.address // bountyAllocator
        )
      })
    })

    context('invalid operations', () => {
      it('cannot remove a repo that was never added', async () => {
        assertRevert(async () => {
          await app.removeRepo('99999', { from: repoRemover })
        })
      })
      it('cannot retrieve a removed Repo', async () => {
        const repoId = addedRepo(
          await app.setRepo('abc', false, '', { from: root })
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

      it('cannot add bounties to unregistered repos', async () => {
        assertRevert(async () => {
          await app.addBounties(
            Array(3).fill('0xdeadbeef'),
            [ 1, 2, 3 ],
            [ 10, 20, 30 ],
            'something cool',
            {
              from: bountyManager,
            }
          )
        })
      })
    })
  })
})
