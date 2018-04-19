
const { assertRevert } = require('../test-helpers/assertThrow')
const getBlockNumber = require('../test-helpers/blockNumber')(web3)
const timeTravel = require('../test-helpers/timeTravel')(web3)
const { encodeCallScript, EMPTY_SCRIPT } = require('../test-helpers/evmScript')
const ExecutionTarget = artifacts.require('ExecutionTarget')

const RangeVoting = artifacts.require('RangeVoting')
const MiniMeToken = artifacts.require('@aragon/os/contracts/lib/minime/MiniMeToken')
const DAOFactory = artifacts.require('@aragon/os/contracts/factory/DAOFactory')
const EVMScriptRegistryFactory = artifacts.require('@aragon/os/contracts/factory/EVMScriptRegistryFactory')
const ACL = artifacts.require('@aragon/os/contracts/acl/ACL')
const Kernel = artifacts.require('@aragon/os/contracts/kernel/Kernel')

const getContract = name => artifacts.require(name)
const pct16 = x => new web3.BigNumber(x).times(new web3.BigNumber(10).toPower(16))
const createdVoteId = receipt => receipt.logs.filter(x => x.event == 'StartVote')[0].args.voteId

const ANY_ADDR = ' 0xffffffffffffffffffffffffffffffffffffffff'


contract('RangeVoting App', accounts => {
    let daoFact, app, token, executionTarget = {}

    const RangeVotingTime = 1000
    const root = accounts[0]

    before(async () => {
        const kernelBase = await getContract('Kernel').new()
        const aclBase = await getContract('ACL').new()
        const regFact = await EVMScriptRegistryFactory.new()
        daoFact = await DAOFactory.new(kernelBase.address, aclBase.address, regFact.address)
    })

    beforeEach(async () => {
        const r = await daoFact.newDAO(root)
        const dao = Kernel.at(r.logs.filter(l => l.event == 'DeployDAO')[0].args.dao)
        const acl = ACL.at(await dao.acl())

        await acl.createPermission(root, dao.address, await dao.APP_MANAGER_ROLE(), root, { from: root })

        const receipt = await dao.newAppInstance('0x1234', (await RangeVoting.new()).address, { from: root })
        app = RangeVoting.at(receipt.logs.filter(l => l.event == 'NewAppProxy')[0].args.proxy)

        await acl.createPermission(ANY_ADDR, app.address, await app.CREATE_VOTES_ROLE(), root, { from: root })
        await acl.createPermission(ANY_ADDR, app.address, await app.ADD_CANDIDATES_ROLE(), root, { from: root })
        await acl.createPermission(ANY_ADDR, app.address, await app.MODIFY_PARTICIPATION_ROLE(), root, { from: root })
    })

    context('normal token supply', () => {
        const holder19 = accounts[0]
        const holder31 = accounts[1]
        const holder50 = accounts[2]
        const nonHolder = accounts[4]

        const minimumParticipation = pct16(50)
        const candidateSupportPct = pct16(5)

        beforeEach(async () => {
            const n = '0x00'
            token = await MiniMeToken.new(n, n, 0, 'n', 0, 'n', true) // empty parameters minime

            await token.generateTokens(holder19, 19)
            await token.generateTokens(holder31, 31)
            await token.generateTokens(holder50, 50)

            await app.initialize(token.address, minimumParticipation, candidateSupportPct, RangeVotingTime)

            executionTarget = await ExecutionTarget.new()
        })

        it('fails on reinitialization', async () => {
            return assertRevert(async () => {
                await app.initialize(token.address, minimumParticipation, candidateSupportPct, RangeVotingTime)
            })
        })

        /*
         // These sections need to be modified when we have the execution methods implemented. Our voting implementation
         // DOES NOT automatically vote on behalf of the person starting the vote as it's category based.
         // We could implement a newVote function with support values but that doesn't make a ton of sense and isn't
         // needed to get our base application up and running.
        it('execution scripts can execute multiple actions', async () => {
            const action = { to: executionTarget.address, calldata: executionTarget.contract.execute.getData() }
            const script = encodeCallScript([action, action, action])
            const voteId = createdVoteId(await app.newVote(script, '', { from: holder50 }))
            assert.equal(await executionTarget.counter(), 3, 'should have executed multiple times')
        })

        it('execution script can be empty', async () => {
            const voteId = createdVoteId(await app.newVote(encodeCallScript([]), '', { from: holder50 }))
        })

        it('execution throws if any action on script throws', async () => {
            const action = { to: executionTarget.address, calldata: executionTarget.contract.execute.getData() }
            let script = encodeCallScript([action])
            script = script.slice(0, -2) // remove one byte from calldata for it to fail
            return assertRevert(async () => {
                await app.newVote(script, '', { from: holder50 })
            })
        })

        it('forwarding creates vote', async () => {
            const action = { to: executionTarget.address, calldata: executionTarget.contract.execute.getData() }
            const script = encodeCallScript([action])
            const voteId = createdVoteId(await app.forward(script, { from: holder50 }))
            assert.equal(voteId, 1, 'RangeVoting should have been created')
        })

        it('can change minimum candidate support', async () => {

        })
        */
        context('creating vote', () => {
            let voteId = {}
            let script = ''
            let candidateState

            beforeEach(async () => {
                const action = { to: executionTarget.address, calldata: executionTarget.contract.execute.getData() }
                script = encodeCallScript([action, action])
                voteId = createdVoteId(await app.newVote(script, 'metadata', { from: nonHolder }))
            })

            it('has correct vote ID', async () => {
                assert.equal(voteId, 1, 'RangeVote should have been created')
            })

            xit('has correct state', async () => {
            })

            it('holder can add candidates', async () => {
                await app.addCandidate(voteId, "0x","Apple")
                candidateState = await app.getCandidate(voteId, "Apple")
                assert.equal(candidateState[0], true, 'Candidate should have been added')
                assert.equal(candidateState[1], "0x", 'Metadata should be 0')
                assert.equal(candidateState[2], 0, 'First candidate should be index 0')
                assert.equal(candidateState[3], 0, 'Support should start at 0')
            })

            xit('holder can vote', async () => {
            })

            xit('holder can modify vote', async () => {
            })

            xit('token transfers dont affect RangeVoting', async () => {
            })

            xit('throws when non-holder votes', async () => {
            })

            xit('throws when RangeVoting after RangeVoting closes', async () => {
            })

            xit('can execute if vote is approved with support and quorum', async () => {
            })

            xit('cannot execute vote if minimum participation not met', async () => {
            })

            xit('cannot execute vote if not support met', async () => {
            })

            xit('cannot re-execute vote', async () => {
            })

            xit('cannot vote on executed vote', async () => {
            })
        })

    })
    context('wrong initializations', () => {
        beforeEach(async() => {
            const n = '0x00'
            token = await MiniMeToken.new(n, n, 0, 'n', 0, 'n', true) // empty parameters minime
        })

        it('fails if min participation is 0', () => {
            const minimumParticipation = pct16(0)
            const candidateSupportPct = pct16(0)
            return assertRevert(async() => {
                await app.initialize(token.address, minimumParticipation, candidateSupportPct, RangeVotingTime)
            })
        })

        it('fails if min candidate support is greater than min participation', () => {
            const minimumParticipation = pct16(20)
            const candidateSupportPct = pct16(50)
            return assertRevert(async() => {
                await app.initialize(token.address, minimumParticipation, candidateSupportPct, RangeVotingTime)
            })
        })

        it('fails if min participation is greater than 100', () => {
            const minimumParticipation = pct16(101)
            const candidateSupportPct = pct16(20)
            return assertRevert(async() => {
                await app.initialize(token.address, minimumParticipation, candidateSupportPct, RangeVotingTime)
            })
        })
    })
    context('token supply = 1', () => {
        const holder = accounts[1]

        const minimumParticipation = pct16(50)
        const candidateSupportPct = pct16(20)

        beforeEach(async () => {
            const n = '0x00'
            token = await MiniMeToken.new(n, n, 0, 'n', 0, 'n', true) // empty parameters minime

            await token.generateTokens(holder, 1)

            await app.initialize(token.address, minimumParticipation, candidateSupportPct, RangeVotingTime)
        })

        xit('new vote cannot be executed before RangeVoting', async () => {


        })

        xit('creating vote as holder executes vote', async () => {

        })
    })

    context('token supply = 3', () => {
        const holder1 = accounts[1]
        const holder2 = accounts[2]

        const minimumParticipation = pct16(34)
        const candidateSupportPct = pct16(20)

        beforeEach(async () => {
            const n = '0x00'
            token = await MiniMeToken.new(n, n, 0, 'n', 0, 'n', true) // empty parameters minime

            await token.generateTokens(holder1, 1)
            await token.generateTokens(holder2, 2)

            await app.initialize(token.address, minimumParticipation, candidateSupportPct, RangeVotingTime)
        })

        xit('new vote cannot be executed before holder2 RangeVoting', async () => {

        })

        xit('creating vote as holder2 executes vote', async () => {

        })
    })
    context('before init', () => {
        it('fails creating a vote before initialization', async () => {
            return assertRevert(async () => {
                await app.newVote(encodeCallScript([]), '')
            })
        })
    })
})
