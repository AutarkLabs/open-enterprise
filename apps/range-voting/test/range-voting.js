const {
  ACL,
  DAOFactory,
  EVMScriptRegistryFactory,
  Kernel,
  MiniMeToken
} = require('@tpt/test-helpers/artifacts')

const RangeVoting = artifacts.require('RangeVotingMock')
const ExecutionTarget = artifacts.require('ExecutionTarget')

const { assertRevert } = require('@tpt/test-helpers/assertThrow')
const { encodeCallScript } = require('@tpt/test-helpers/evmScript')
const timeTravel = require('@tpt/test-helpers/timeTravel')(web3)

const pct16 = x =>
  new web3.BigNumber(x).times(new web3.BigNumber(10).toPower(16))
const createdVoteId = receipt =>
  receipt.logs.filter(x => x.event === 'StartVote')[0].args.voteId

const ANY_ADDR = '0xffffffffffffffffffffffffffffffffffffffff'
const NULL_ADDRESS = '0x00'

// const VOTER_STATE = ['ABSENT', 'YEA', 'NAY'].reduce((state, key, index) => {
//   state[key] = index
//   return state
// }, {})

contract('RangeVoting App', accounts => {
  let daoFact = {}
  let app = {}
  let token = {}
  let executionTarget = {}

  const RangeVotingTime = 1000
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

    // TODO: Revert to only use 2 params when truffle is updated
    // read: https://github.com/Giveth/planning-app/pull/243
    const receipt = await dao.newAppInstance(
      '0x1234',
      (await RangeVoting.new()).address,
      0x0,
      false,
      { from: root }
    )
    app = RangeVoting.at(
      receipt.logs.filter(l => l.event === 'NewAppProxy')[0].args.proxy
    )

    await acl.createPermission(
      ANY_ADDR,
      app.address,
      await app.CREATE_VOTES_ROLE(),
      root,
      { from: root }
    )
    await acl.createPermission(
      ANY_ADDR,
      app.address,
      await app.ADD_CANDIDATES_ROLE(),
      root,
      { from: root }
    )
    await acl.createPermission(
      ANY_ADDR,
      app.address,
      await app.MODIFY_PARTICIPATION_ROLE(),
      root,
      { from: root }
    )
  })

  context('normal token supply', () => {
    const holder19 = accounts[0]
    const holder31 = accounts[1]
    const holder50 = accounts[2]
    const nonHolder = accounts[4]

    const minimumParticipation = pct16(30)
    const candidateSupportPct = pct16(5)

    beforeEach(async () => {
      token = await MiniMeToken.new(
        NULL_ADDRESS,
        NULL_ADDRESS,
        0,
        'n',
        0,
        'n',
        true
      ) // empty parameters minime

      await token.generateTokens(holder19, 19)
      await token.generateTokens(holder31, 31)
      await token.generateTokens(holder50, 50)

      await app.initialize(
        token.address,
        minimumParticipation,
        candidateSupportPct,
        RangeVotingTime
      )

      executionTarget = await ExecutionTarget.new()
    })

    it('fails on reinitialization', async () => {
      return assertRevert(async () => {
        await app.initialize(
          token.address,
          minimumParticipation,
          candidateSupportPct,
          RangeVotingTime
        )
      })
    })

    it('can create new vote', async () => {
      let action = {
        to: executionTarget.address,
        calldata: executionTarget.contract.setSignal.getData(
          [accounts[7], accounts[8], accounts[9]],
          [0, 0, 0]
        )
      }
      const script = encodeCallScript([action])
      const voteId = createdVoteId(
        await app.newVote(script, '', { from: holder50 })
      )
    })
    it('can cast votes', async () => {
      let action = {
        to: executionTarget.address,
        calldata: executionTarget.contract.setSignal.getData(
          [accounts[7], accounts[8], accounts[9]],
          [0, 0, 0]
        )
      }
      const script = encodeCallScript([action])
      const voteId = createdVoteId(
        await app.newVote(script, '', { from: holder50 })
      )
      let vote = [10, 15, 25]
      let voter = holder50
      await app.vote(voteId, vote, { from: voter })
    })
    it('execution scripts can execute actions', async () => {
      let action = {
        to: executionTarget.address,
        calldata: executionTarget.contract.setSignal.getData(
          [accounts[7], accounts[8], accounts[9]],
          [0, 0, 0]
        )
      }
      const script = encodeCallScript([action])
      const voteId = createdVoteId(
        await app.newVote(script, '', { from: holder50 })
      )
      let vote = [10, 15, 25]
      let voter = holder50
      await app.vote(voteId, vote, { from: voter })
      timeTravel(RangeVotingTime + 1)
      await app.executeVote(voteId)
      let signal
      for (let i = 0; i < vote.length; i++) {
        signal = await executionTarget.getSignal(i)
        assert.equal(
          signal.toNumber(),
          vote[i],
          'Signal ' + i + ' should be ' + vote[i]
        )
      }
    })

    it('execution script can be empty', async () => {
      let callScript = encodeCallScript([])
      const voteId = createdVoteId(
        await app.newVote(callScript, '', { from: holder50 })
      )
      assert.equal(voteId, 1, 'A vote should be created with empty script')
    })

    it('execution throws if any action on script throws', async () => {
      let action = {
        to: executionTarget.address,
        calldata: executionTarget.contract.setSignal.getData([], [])
      }
      const script = encodeCallScript([action])
      const voteId = createdVoteId(
        await app.newVote(script, '', { from: holder50 })
      )
      let vote = [10, 15, 25]
      await app.addCandidate(voteId, '0x', accounts[7])
      await app.addCandidate(voteId, '0x', accounts[8])
      await app.addCandidate(voteId, '0x', accounts[9])
      let voter = holder50
      await app.vote(voteId, vote, { from: voter })
      return assertRevert(async () => {
        await app.executeVote(voteId)
      })
    })

    it('forwarding creates vote', async () => {
      let action = {
        to: executionTarget.address,
        calldata: executionTarget.contract.setSignal.getData(
          [accounts[7], accounts[8], accounts[9]],
          [0, 0, 0]
        )
      }
      const script = encodeCallScript([action])
      const voteId = createdVoteId(
        await app.forward(script, { from: holder50 })
      )
      assert.equal(voteId, 1, 'RangeVoting should have been created')
    })

    xit('can change minimum candidate support', async () => {})

    context('creating vote with normal distributions', () => {
      let voteId = {}
      let script = ''
      let candidateState
      let [, , ...candidates] = accounts
      let [apple, orange, banana] = candidates

      beforeEach(async () => {
        let action = {
          to: executionTarget.address,
          calldata: executionTarget.contract.setSignal.getData(
            // TODO: Candidates need to be added in reverse order to keep their initial index
            candidates.reverse(),
            [0, 0, 0]
          )
        }

        script = encodeCallScript([action, action])
        let newvote = await app.newVote(script, 'metadata', { from: nonHolder })
        voteId = createdVoteId(newvote)
      })

      it('has correct vote ID', async () => {
        assert.equal(voteId, 1, 'RangeVote should have been created')
      })

      it('stored the candidate addresses correctly', async () => {
        let appleAddressAdded = (await app.getCandidate(
          voteId,
          candidates.indexOf(apple)
        ))[0]
        let orangeAddressAdded = (await app.getCandidate(
          voteId,
          candidates.indexOf(orange)
        ))[0]
        let bananaAddressAdded = (await app.getCandidate(
          voteId,
          candidates.indexOf(banana)
        ))[0]
        assert.equal(
          appleAddressAdded,
          apple,
          'apple address extracted incorrectly'
        )
        assert.equal(
          orangeAddressAdded,
          orange,
          'orange address extracted incorrectly'
        )
        assert.equal(
          bananaAddressAdded,
          banana,
          'banana address extracted incorrectly'
        )
      })
      it('has correct state', async () => {
        let voteState = await app.getVote(voteId)
        let tokenBalance = await token.totalSupply()
        assert.equal(voteState[0], true, 'is true')
        assert.equal(voteState[1], nonHolder, 'is nonHolder')
        assert.equal(
          voteState[4].toNumber(),
          candidateSupportPct.toNumber(),
          'is candidateSupportPct'
        )
        assert.equal(
          voteState[5].toNumber(),
          tokenBalance.toNumber(),
          'is token.totalSupply()'
        )
        assert.equal(voteState[6].toNumber(), 0, 'is totalParticipation')
        assert.equal(voteState[8], script, 'is script')
        assert.equal(voteState[9], false, 'is false')
      })

      xit('holder can add candidates', async () => {
        await app.addCandidate(voteId, '0xdeadbeef', accounts[5])
        candidateState = await app.getCandidate(voteId, accounts[5])
        assert.equal(
          candidateState[0],
          true,
          'Candidate should have been added'
        )
        assert.equal(
          candidateState[1],
          '0xdeadbeef',
          'Metadata should be 0xdeadbeef'
        )
        assert.equal(
          candidateState[2].toNumber(),
          3,
          'Fourth candidate should be at index 3'
        )
        assert.equal(
          candidateState[3].toNumber(),
          0,
          'Support should start at 0'
        )
        await app.addCandidate(voteId, '0x', accounts[8])
        await app.addCandidate(voteId, '0x', accounts[9])
      })

      xit('holder can vote', async () => {
        let vote = [1, 2, 3, 4, 5, 0]
        await app.addCandidate(voteId, '0xdeadbeef', accounts[6])
        await app.addCandidate(voteId, '0xdead', accounts[7])
        await app.addCandidate(voteId, '0xbeef', accounts[8])
        let voter = holder19
        await app.vote(voteId, vote, { from: voter })

        let holderVoteData = await app.getVoterState(voteId, voter)
        assert.equal(
          vote[0],
          holderVoteData[0].toNumber(),
          'vote and voter state should match after casting ballot'
        )
        assert.equal(
          vote[1],
          holderVoteData[1].toNumber(),
          'vote and voter state should match after casting ballot'
        )
        assert.equal(
          vote[2],
          holderVoteData[2].toNumber(),
          'vote and voter state should match after casting ballot'
        )

        let candidateApple = await app.getCandidate(voteId, accounts[6])
        let candidateOrange = await app.getCandidate(voteId, accounts[7])
        let candidateBanana = await app.getCandidate(voteId, accounts[8])

        assert.equal(
          vote[3],
          candidateApple[3].toNumber(),
          'The correct amount of support should be logged for Apple'
        )
        assert.equal(
          vote[4],
          candidateOrange[3].toNumber(),
          'The correct amount of support should be logged for Orange'
        )
        assert.equal(
          vote[5],
          candidateBanana[3].toNumber(),
          'The correct amount of support should be logged for Banana'
        )
      })

      xit('holder can modify vote', async () => {
        let voteOne = [1, 2, 3, 4, 5, 0]
        let voteTwo = [0, 5, 4, 3, 2, 1]
        await app.addCandidate(voteId, '0x', accounts[7])
        await app.addCandidate(voteId, '0x', accounts[8])
        await app.addCandidate(voteId, '0x', accounts[9])
        let voter = holder19
        await app.vote(voteId, voteOne, { from: voter })
        let holderVoteData1 = await app.getVoterState(voteId, voter)
        assert.equal(
          voteOne[0],
          holderVoteData1[0].toNumber(),
          'vote and voter state should match after casting ballot'
        )
        assert.equal(
          voteOne[1],
          holderVoteData1[1].toNumber(),
          'vote and voter state should match after casting ballot'
        )
        assert.equal(
          voteOne[2],
          holderVoteData1[2].toNumber(),
          'vote and voter state should match after casting ballot'
        )
        await app.vote(voteId, voteTwo, { from: voter })
        let holderVoteData2 = await app.getVoterState(voteId, voter)
        assert.equal(
          voteTwo[0],
          holderVoteData2[0].toNumber(),
          'vote and voter state should match after casting ballot'
        )
        assert.equal(
          voteTwo[1],
          holderVoteData2[1].toNumber(),
          'vote and voter state should match after casting ballot'
        )
        assert.equal(
          voteTwo[2],
          holderVoteData2[2].toNumber(),
          'vote and voter state should match after casting ballot'
        )
        let candidateApple = await app.getCandidate(voteId, accounts[7])
        let candidateOrange = await app.getCandidate(voteId, accounts[8])
        let candidateBanana = await app.getCandidate(voteId, accounts[9])
        assert.equal(
          voteTwo[3],
          candidateApple[3].toNumber(),
          'The correct amount of support should be logged for apple'
        )
        assert.equal(
          voteTwo[4],
          candidateOrange[3].toNumber(),
          'The correct amount of support should be logged for orange'
        )
        assert.equal(
          voteTwo[5],
          candidateBanana[3].toNumber(),
          'The correct amount of support should be logged for banana'
        )
      })

      xit('token transfers dont affect RangeVoting', async () => {
        let vote = [10, 9, 12]
        let voter = holder31
        await app.addCandidate(voteId, '0x', accounts[7])
        await app.addCandidate(voteId, '0x', accounts[8])
        await app.addCandidate(voteId, '0x', accounts[9])
        await app.vote(voteId, vote, { from: voter })
        let holderVoteData1 = await app.getVoterState(voteId, voter)
        assert.equal(
          vote[0],
          holderVoteData1[0].toNumber(),
          'vote and voter state should match after casting ballot'
        )
        assert.equal(
          vote[1],
          holderVoteData1[1].toNumber(),
          'vote and voter state should match after casting ballot'
        )
        assert.equal(
          vote[2],
          holderVoteData1[2].toNumber(),
          'vote and voter state should match after casting ballot'
        )
      })

      xit('cannot execute during open vote', async () => {
        const voteState = await app.getVote(voteId)
        const canExecute = await app.canExecute(voteId)
        assert.equal(canExecute, false, 'canExecute should be false')
      })
      xit('can execute if vote has sufficient candidate support', async () => {
        let voteOne = [4, 15, 0]
        let voteTwo = [20, 10, 1]
        let voteThree = [30, 15, 5]
        await app.vote(voteId, voteOne, { from: holder19 })
        await app.vote(voteId, voteTwo, { from: holder31 })
        await app.vote(voteId, voteThree, { from: holder50 })
        const voteState = await app.getVote(voteId)
        timeTravel(RangeVotingTime + 1)
        const canExecute = await app.canExecute(voteId)

        assert.equal(canExecute, true, 'canExecute should be true')
      })
      it('cannot execute if vote has insufficient candidate support', async () => {
        let voteOne = [2, 17, 0]
        let voteTwo = [18, 12, 1]
        let voteThree = [30, 19, 1]
        await app.vote(voteId, voteOne, { from: holder19 })
        await app.vote(voteId, voteTwo, { from: holder31 })
        await app.vote(voteId, voteThree, { from: holder50 })
        timeTravel(RangeVotingTime + 1)
        const canExecute = await app.canExecute(voteId)
        assert.equal(canExecute, false, 'canExecute should be false')
      })
      xit('can execute vote if minimum participation (quorum) has been met', async () => {
        let voteOne = [10, 0, 0]
        let voteTwo = [0, 20, 0]
        let voteThree = [0, 0, 40]
        await app.vote(voteId, voteOne, { from: holder19 })
        await app.vote(voteId, voteTwo, { from: holder31 })
        await app.vote(voteId, voteThree, { from: holder50 })
        timeTravel(RangeVotingTime + 1)
        const canExecute = await app.canExecute(voteId)

        assert.equal(canExecute, true, 'canExecute should be true')
      })
      it('cannot execute vote if minimum participation (quorum) not met', async () => {
        let voteOne = [10, 0, 0]
        let voteTwo = [0, 9, 0]
        let voteThree = [0, 0, 10]
        await app.vote(voteId, voteOne, { from: holder19 })
        await app.vote(voteId, voteTwo, { from: holder31 })
        await app.vote(voteId, voteThree, { from: holder50 })
        timeTravel(RangeVotingTime + 1)
        const canExecute = await app.canExecute(voteId)
        assert.equal(canExecute, false, 'canExecute should be false')
      })
    })
  })
  context('wrong initializations', () => {
    beforeEach(async () => {
      const n = '0x00'
      token = await MiniMeToken.new(n, n, 0, 'n', 0, 'n', true) // empty parameters minime
    })

    it('fails if min participation is 0', () => {
      const minimumParticipation = pct16(0)
      const candidateSupportPct = pct16(0)
      return assertRevert(async () => {
        await app.initialize(
          token.address,
          minimumParticipation,
          candidateSupportPct,
          RangeVotingTime
        )
      })
    })

    it('fails if min candidate support is greater than min participation', () => {
      const minimumParticipation = pct16(20)
      const candidateSupportPct = pct16(50)
      return assertRevert(async () => {
        await app.initialize(
          token.address,
          minimumParticipation,
          candidateSupportPct,
          RangeVotingTime
        )
      })
    })

    it('fails if min participation is greater than 100', () => {
      const minimumParticipation = pct16(101)
      const candidateSupportPct = pct16(20)
      return assertRevert(async () => {
        await app.initialize(
          token.address,
          minimumParticipation,
          candidateSupportPct,
          RangeVotingTime
        )
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

      await app.initialize(
        token.address,
        minimumParticipation,
        candidateSupportPct,
        RangeVotingTime
      )
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

      await app.initialize(
        token.address,
        minimumParticipation,
        candidateSupportPct,
        RangeVotingTime
      )
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
