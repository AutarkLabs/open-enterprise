
const { assertRevert } = require('../test-helpers/assertThrow')
const getBlockNumber = require('../test-helpers/blockNumber')(web3)
const timeTravel = require('../test-helpers/timeTravel')(web3)
const { encodeCallScript, EMPTY_SCRIPT } = require('../test-helpers/evmScript')
const ExecutionTarget = artifacts.require('ExecutionTarget')

const GithubRegistry = artifacts.require('GithubRegistry')
const MiniMeToken = artifacts.require('@aragon/os/contracts/lib/minime/MiniMeToken')
const DAOFactory = artifacts.require('@aragon/os/contracts/factory/DAOFactory')
const EVMScriptRegistryFactory = artifacts.require('@aragon/os/contracts/factory/EVMScriptRegistryFactory')
const ACL = artifacts.require('@aragon/os/contracts/acl/ACL')
const Kernel = artifacts.require('@aragon/os/contracts/kernel/Kernel')

const getContract = name => artifacts.require(name)
const pct16 = x => new web3.BigNumber(x).times(new web3.BigNumber(10).toPower(16))
const createdVoteId = receipt => receipt.logs.filter(x => x.event == 'StartVote')[0].args.voteId

const ANY_ADDR = ' 0xffffffffffffffffffffffffffffffffffffffff'


contract('Github Registry App', accounts => {
    let daoFact, app, token, executionTarget = {}

    const RangeVotingTime = 1000
    const root = accounts[0]

    before(async () => {
        //Create Base DAO Contracts
        const kernelBase = await getContract('Kernel').new()
        const aclBase = await getContract('ACL').new()
        const regFact = await EVMScriptRegistryFactory.new()
        daoFact = await DAOFactory.new(kernelBase.address, aclBase.address, regFact.address)
    })

    beforeEach(async () => {
        //Deploy Base DAO Contracts
        const r = await daoFact.newDAO(root)
        const dao = Kernel.at(r.logs.filter(l => l.event == 'DeployDAO')[0].args.dao)
        const acl = ACL.at(await dao.acl())

        //Create DAO admin role
        await acl.createPermission(root, dao.address, await dao.APP_MANAGER_ROLE(), root, { from: root })
        
        //Deploy Contract to be tested
        const receipt = await dao.newAppInstance('0x1234', (await GithubRegistry.new()).address, { from: root })
        app = GithubRegistry.at(receipt.logs.filter(l => l.event == 'NewAppProxy')[0].args.proxy)

        //create ACL permissions
        await acl.createPermission(ANY_ADDR, app.address, await app.ADD_ENTRY_ROLE(), root, { from: root })
        await acl.createPermission(ANY_ADDR, app.address, await app.REMOVE_ENTRY_ROLE(), root, { from: root })
        await acl.createPermission(ANY_ADDR, app.address, await app.ADD_BOUNTY_ROLE(), root, { from: root })
    })

    context('')

    context('normal token supply', () => {
        const holder19 = accounts[0]
        const holder31 = accounts[1]
        const holder50 = accounts[2]
        const nonHolder = accounts[4]

        const minimumParticipation = pct16(30)
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

        it('execution scripts can execute actions', async () => {
            let action = { to: executionTarget.address, calldata: executionTarget.contract.setSignal.getData([0])}
            const script = encodeCallScript([action])
            const voteId = createdVoteId(await app.newVote(script, '', { from: holder50 }))
            let vote = [10,15,25]
            await app.addCandidate(voteId, "0x","Apple")
            await app.addCandidate(voteId, "0x","Orange")
            await app.addCandidate(voteId, "0x","Banana")
            let voter = holder50
            await app.vote(voteId, vote, { from: voter })
            await app.executeVote(voteId)        
            assert.equal(await executionTarget.signal(0), 10, 'should have executed multiple times')
        })

        it('execution script can be empty', async () => {
            const voteId = createdVoteId(await app.newVote(encodeCallScript([]), '', { from: holder50 }))
        })

        it('execution throws if any action on script throws', async () => {
            let action = { to: executionTarget.address, calldata: executionTarget.contract.autoThrow.getData([0])}
            const script = encodeCallScript([action])
            const voteId = createdVoteId(await app.newVote(script, '', { from: holder50 }))
            let vote = [10,15,25]
            await app.addCandidate(voteId, "0x","Apple")
            await app.addCandidate(voteId, "0x","Orange")
            await app.addCandidate(voteId, "0x","Banana")
            let voter = holder50
            await app.vote(voteId, vote, { from: voter })
            return assertRevert(async () => {
                await app.executeVote(voteId)        
            })
        })

        it('forwarding creates vote', async () => {
            const action = { to: executionTarget.address, calldata: executionTarget.contract.setSignal.getData([0]) }
            const script = encodeCallScript([action])
            const voteId = createdVoteId(await app.forward(script, { from: holder50 }))
            assert.equal(voteId, 1, 'RangeVoting should have been created')
        })

        it('can change minimum candidate support', async () => {

        })


        context('creating vote with normal distributions', () => {
            let voteId = {}
            let script = ''
            let candidateState

            beforeEach(async () => {
                const action = { to: executionTarget.address, calldata: executionTarget.contract.setSignal.getData([0]) }
                script = encodeCallScript([action, action])
                let newvote = await app.newVote(script, 'metadata', { from: nonHolder })
                //console.log(newvote.logs[0].args)
                voteId = createdVoteId(newvote)
            })

            it('has correct vote ID', async () => {
                assert.equal(voteId, 1, 'RangeVote should have been created')
            })

            it('has correct state', async () => {
                let voteState = await app.getVote(voteId)
                let tokenBalance = await token.totalSupply()
                assert.equal(voteState[0], true, "is true")
                assert.equal(voteState[1], nonHolder, "is nonHolder")
                assert.equal(voteState[4].toNumber(), candidateSupportPct.toNumber(), "is candidateSupportPct")
                assert.equal(voteState[5].toNumber(), tokenBalance.toNumber(), "is token.totalSupply()")
                assert.equal(voteState[6], 'metadata', "is metadata")
                assert.equal(voteState[7], script, "is script")
                assert.equal(voteState[8], false, "is false")
            })

            it('holder can add candidates', async () => {
                await app.addCandidate(voteId, "0x","Apple")
                candidateState = await app.getCandidate(voteId, "Apple")
                assert.equal(candidateState[0], true, 'Candidate should have been added')
                assert.equal(candidateState[1], "0x", 'Metadata should be 0')
                assert.equal(candidateState[2], 0, 'First candidate should be index 0')
                assert.equal(candidateState[3], 0, 'Support should start at 0')
                await app.addCandidate(voteId, "0x","Orange")
                await app.addCandidate(voteId, "0x","Race Car")
            })

            it('holder can vote', async () => {
                let vote = [2,3,4]
                await app.addCandidate(voteId, "0x","Apple")
                await app.addCandidate(voteId, "0x","Orange")
                await app.addCandidate(voteId, "0x","Banana")
                let voter = holder19
                await app.vote(voteId, vote, { from: voter })

                let holderVoteData = await app.getVoterState(voteId, voter)
                assert.equal(vote[0], holderVoteData[0].toNumber(), "vote and voter state should match after casting ballot")
                assert.equal(vote[1], holderVoteData[1].toNumber(), "vote and voter state should match after casting ballot")
                assert.equal(vote[2], holderVoteData[2].toNumber(), "vote and voter state should match after casting ballot")
                let candidateApple = await app.getCandidate(voteId, "Apple")
                let candidateOrange = await app.getCandidate(voteId, "Orange")
                let candidateBanana = await app.getCandidate(voteId, "Banana")
                assert.equal(vote[0], candidateApple[3], "The correct amount of support should be logged for apple")
                assert.equal(vote[1], candidateOrange[3], "The correct amount of support should be logged for orange")
                assert.equal(vote[2], candidateBanana[3], "The correct amount of support should be logged for Banana")
            })

            it('holder can modify vote', async () => {
                let voteOne = [2,3,4]
                let voteTwo = [4,3,2]
                await app.addCandidate(voteId, "0x","Apple")
                await app.addCandidate(voteId, "0x","Orange")
                await app.addCandidate(voteId, "0x","Banana")
                let voter = holder19
                await app.vote(voteId, voteOne, { from: voter })
                await app.vote(voteId, voteTwo, { from: voter })
                let holderVoteData = await app.getVoterState(voteId, voter)
                assert.equal(voteTwo[0], holderVoteData[0].toNumber(), "vote and voter state should match after casting ballot")
                assert.equal(voteTwo[1], holderVoteData[1].toNumber(), "vote and voter state should match after casting ballot")
                assert.equal(voteTwo[2], holderVoteData[2].toNumber(), "vote and voter state should match after casting ballot")
                let candidateApple = await app.getCandidate(voteId, "Apple")
                let candidateOrange = await app.getCandidate(voteId, "Orange")
                let candidateBanana = await app.getCandidate(voteId, "Banana")
                assert.equal(voteTwo[0], candidateApple[3], "The correct amount of support should be logged for apple")
                assert.equal(voteTwo[1], candidateOrange[3], "The correct amount of support should be logged for orange")
                assert.equal(voteTwo[2], candidateBanana[3], "The correct amount of support should be logged for banana")
            })

            it('token transfers dont affect RangeVoting', async () => {
                let vote = [10,9,12]
                let voter = holder31
                await app.addCandidate(voteId, "0x","Apple")
                await app.addCandidate(voteId, "0x","Orange")
                await app.addCandidate(voteId, "0x","Banana")
                //await token.transfer(nonHolder, 31, { from: voter })
                await app.vote(voteId, vote, { from: voter })
                let holderVoteData = await app.getVoterState(voteId, voter)
                assert.equal(vote[0], holderVoteData[0].toNumber(), "vote and voter state should match after casting ballot")
                assert.equal(vote[1], holderVoteData[1].toNumber(), "vote and voter state should match after casting ballot")
                assert.equal(vote[2], holderVoteData[2].toNumber(), "vote and voter state should match after casting ballot")
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

            await token.generateTokens(holder)

            await app.initialize(token.address, minimumParticipation, candidateSupportPct, RangeVotingTime)
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

    })
    context('before init', () => {
        it('fails creating a vote before initialization', async () => {
            return assertRevert(async () => {
                await app.newVote(encodeCallScript([]), '')
            })
        })
    })
})
