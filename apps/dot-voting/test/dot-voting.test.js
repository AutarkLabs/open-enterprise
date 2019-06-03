const ACL = artifacts.require('ACL')
const DAOFactory = artifacts.require('DAOFactory')
const EVMScriptRegistryFactory = artifacts.require('EVMScriptRegistryFactory')
const Kernel = artifacts.require('Kernel')
const MiniMeToken = artifacts.require('MiniMeToken')

const DotVoting = artifacts.require('DotVotingMock')
const AddressBook = artifacts.require('AddressBook')
const ExecutionTarget = artifacts.require('ExecutionTarget')

const { assertRevert } = require('@tps/test-helpers/assertThrow')
const { encodeCallScript } = require('@tps/test-helpers/evmScript')
const timeTravel = require('@tps/test-helpers/timeTravel')(web3)

const pct16 = x =>
  new web3.BigNumber(x).times(new web3.BigNumber(10).toPower(16))
const getCreatedVoteId = receipt =>
  receipt.logs.filter(x => x.event === 'StartVote')[0].args.voteId

const getCastedVoteId = receipt =>
  receipt.logs.filter(x => x.event === 'CastVote')[0].args.voteId

const parseVoteIdToNumber = voteId =>
  new web3.BigNumber(voteId).toNumber()

const ANY_ADDR = '0xffffffffffffffffffffffffffffffffffffffff'
const NULL_ADDRESS = '0x00'


contract('DotVoting App', accounts => {
  let daoFact = {}
  let app = {}
  let book = {}
  let token = {}
  let executionTarget = {}

  const DotVotingTime = 1000
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

    // TODO: Revert to only use 2 params when truffle is updated
    // read: https://github.com/AutarkLabs/planning-suite/pull/243
    let receipt = await dao.newAppInstance(
      '0x1234',
      (await DotVoting.new()).address,
      0x0,
      false,
      { from: root }
    )

    app = DotVoting.at(
      receipt.logs.filter(l => l.event === 'NewAppProxy')[0].args.proxy
    )

    receipt = await dao.newAppInstance(
      '0x5678',
      (await AddressBook.new()).address,
      0x0,
      false,
      { from: root }
    )
    book = AddressBook.at(
      receipt.logs.filter(l => l.event == 'NewAppProxy')[0].args.proxy
    )

    await book.initialize()

    await acl.createPermission(
      ANY_ADDR,
      book.address,
      await book.ADD_ENTRY_ROLE(),
      root,
      { from: root }
    )
    await acl.createPermission(
      ANY_ADDR,
      book.address,
      await book.REMOVE_ENTRY_ROLE(),
      root,
      { from: root }
    )

    await acl.createPermission(
      accounts[2],
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
  })

  context('before init', () => {
    it('fails creating a vote before initialization', async () => {
      return assertRevert(async () => {
        await app.newVote(encodeCallScript([]), '')
      })
    })

    it('is a forwarder contract', async () => {
      const result = await app.isForwarder()
      assert.isTrue(result, 'contract must return true for isForwarder call')
    })

    it('cannot initialize with min Participation pct equal to 0', async () => {
      const candidateSupportPct = pct16(5)
      return assertRevert(async () => {
        await app.initialize(
          book.address,
          0,                    // token address
          0,                    // minimumParticipation
          candidateSupportPct,
          DotVotingTime
        )
      })
    })

    it('cannot initialize with min Participation pct greater than PCT_BASE', async () => {
      const candidateSupportPct = pct16(5)
      return assertRevert(async () => {
        await app.initialize(
          book.address,
          0,          // token address
          1.1e18,     // minimumParticipation
          candidateSupportPct,
          DotVotingTime
        )
      })
    })
    it('cannot initialize with min Participation pct less than candidate support pct', async () => {
      const candidateSupportPct = pct16(5)
      const minimumParticipation = pct16(1)
      return assertRevert(async () => {
        await app.initialize(
          book.address,
          0,    // token address
          minimumParticipation,
          candidateSupportPct,
          DotVotingTime
        )
      })
    })
  })

  context('normal token supply', () => {
    const holder19 = accounts[0]
    const holder31 = accounts[1]
    const holder50 = accounts[2]
    const nonHolder = accounts[4]

    const minimumParticipation = pct16(30)
    const candidateSupportPct = pct16(5)

    before(async () => {
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
        book.address,
        token.address,
        minimumParticipation,
        candidateSupportPct,
        DotVotingTime
      )

      executionTarget = await ExecutionTarget.new()
    })

    it('fails on reinitialization', async () => {
      return assertRevert(async () => {
        await app.initialize(
          book.address,
          token.address,
          minimumParticipation,
          candidateSupportPct,
          DotVotingTime
        )
      })
    })

    it('can create new vote', async () => {
      let action = {
        to: executionTarget.address,
        calldata: executionTarget.contract.setSignal.getData(
          [ accounts[7], accounts[8], accounts[9] ],
          [ 0, 0, 0 ],
          [ 4, 4, 4 ],
          'arg1arg2arg3',
          'description',
          [ 0x61, 0x61, 0x61 ],
          [ 0x61, 0x61, 0x61 ],
          5,
          false
        )
      }
      const script = encodeCallScript([action])
      const voteId = getCreatedVoteId(
        await app.newVote(script, '', { from: holder50 })
      )
      assert.equal(parseVoteIdToNumber(voteId), 1, 'A vote should be created with empty script')
    })
    it('tokenholders can cast votes', async () => {
      let action = {
        to: executionTarget.address,
        calldata: executionTarget.contract.setSignal.getData(
          [ accounts[7], accounts[8], accounts[9] ],
          [ 0, 0, 0 ],
          [ 4, 4, 4 ],
          'arg1arg2arg3',
          'description',
          [ '0x0', '0x0', '0x0' ],
          [ '0x0', '0x0', '0x0' ],
          5,
          false
        )
      }
      const script = encodeCallScript([action])
      const voteId = getCreatedVoteId(
        await app.newVote(script, '', { from: holder50 })
      )
      assert.equal(parseVoteIdToNumber(voteId), 2, 'A vote should be created with empty script')
      let vote = [ 10, 15, 25 ]
      let voter = holder50
      const castedVoteId = getCastedVoteId(
        await app.vote(voteId, vote, { from: voter })
      )
      assert.equal(parseVoteIdToNumber(castedVoteId), 2, 'A vote should have been casted to vote Id #2')
    })
    it('execution scripts can execute actions', async () => {
      let action = {
        to: executionTarget.address,
        calldata: executionTarget.contract.setSignal.getData(
          [ accounts[7], accounts[8], accounts[9] ],
          [ 0, 0, 0 ],
          [ 4, 4, 4 ],
          'arg1arg2arg3',
          'description',
          [ 1, 2, 3 ],
          [ 2, 4, 6 ],
          5,
          true
        )
      }
      const script = encodeCallScript([action])
      const voteId = getCreatedVoteId(
        await app.newVote(script, '', { from: holder50 })
      )
      let vote = [ 10, 15, 25 ]
      let voter = holder50
      await app.vote(voteId, vote, { from: voter })
      timeTravel(DotVotingTime + 1)
      await app.executeVote(voteId)
      //assert.equal(1,0)
      let signal
      for (let i = 0; i < vote.length; i++) {
        signal = await executionTarget.getSignal(i)
        assert.equal(
          signal[0].toNumber(),
          vote[i],
          'Signal ' + i + ' should be ' + vote[i]
        )
        assert.equal(
          signal[1].toNumber(),
          (i+1),
          'Id1 ' + ( i + 1 ) + 'is incorrect'
        )
        assert.equal(
          signal[2].toNumber(),
          ( 2 * ( i + 1 )),
          'Id2 ' + ( 2 * ( i + 1 ))+ ' is incorrect'
        )
      }
    })

    it('execution scripts must match calldata length', async () => {
      let action = {
        to: executionTarget.address,
        calldata: executionTarget.contract.setSignal.getData(
          // original args: address[], uint256[] supports
          //  updated args: address[], uint256[] supports, uint256[] infoIndex, string Info
          [ accounts[7], accounts[8], accounts[9] ],
          [ 0, 0, 0 ],
          [ 4, 4, 4 ],
          'arg1arg2arg3',
          'vote description',
          [ 1, 2, 3 ],
          [ 2, 4, 6 ],
          5,
          true
        )
      }

      let script = encodeCallScript([action])
      script += '12' // add one byte to the script

      return assertRevert(async () => {
        await app.newVote(script, '', { from: holder50 })
      })
    })

    it('execution script can be empty', async () => {
      let callScript = encodeCallScript([])
      const voteId = getCreatedVoteId(
        await app.newVote(callScript, '', { from: holder50 })
      )
      assert.equal(parseVoteIdToNumber(voteId), 4, 'A vote should be created with empty script')
    })

    it('execution throws if any action on script throws', async () => {
      let action = {
        to: executionTarget.address,
        calldata: executionTarget.contract.setSignal.getData([], [], [], '', '', [],[],0,true)
      }
      const script = encodeCallScript([action])
      const voteId = getCreatedVoteId(
        await app.newVote(script, '', { from: holder50 })
      )
      let vote = [ 10, 15, 25 ]
      await app.addCandidate(voteId, '0x', accounts[7],0x0,0x0)
      await app.addCandidate(voteId, '0x', accounts[8],0x0,0x0)
      await app.addCandidate(voteId, '0x', accounts[9],0x0,0x0)
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
          [ accounts[7], accounts[8], accounts[9] ],
          [ 0, 0, 0 ],
          [ 4, 4, 4 ],
          'arg1arg2arg3',
          'description',
          [ '0x0', '0x0', '0x0' ],
          [ '0x0', '0x0', '0x0' ],
          5,
          false
        )
      }
      const script = encodeCallScript([action])
      const voteId = getCreatedVoteId(
        await app.forward(script, { from: holder50 })
      )
      assert.equal(parseVoteIdToNumber(voteId), 6, 'DotVoting should have been created')
    })

    it('unauthorized entities cannot forward to contract', () => {
      let action = {
        to: executionTarget.address,
        calldata: executionTarget.contract.setSignal.getData(
          [ accounts[7], accounts[8], accounts[9] ],
          [ 0, 0, 0 ],
          [ 4, 4, 4 ],
          'arg1arg2arg3',
          'description',
          [ '0x0', '0x0', '0x0' ],
          [ '0x0', '0x0', '0x0' ],
          5,
          false
        )
      }
      const script = encodeCallScript([action])
      return assertRevert(async () => {
        await app.forward(script, { from: nonHolder })
      })
    })

    it('Rejects if supplied script length and actual script length are not equal', async () => {
      let action = {
        to: executionTarget.address,
        calldata: executionTarget.contract.setSignal.getData(
          [ accounts[7], accounts[8], accounts[9] ],
          [ 0, 0, 0 ],
          [ 4, 4, 4 ],
          'arg1arg2arg3',
          'description',
          [ '0x0', '0x0', '0x0' ],
          [ '0x0', '0x0', '0x0' ],
          5,
          false
        )
      }
      const script = encodeCallScript([action]) + '00'
      return assertRevert(async () => {
        await app.newVote(script, '', { from: holder50 })
      })
    })

    it('only accepts scripts with a specID of 1', async () => {
      let action = {
        to: executionTarget.address,
        calldata: executionTarget.contract.setSignal.getData(
          [ accounts[7], accounts[8], accounts[9] ],
          [ 0, 0, 0 ],
          [ 4, 4, 4 ],
          'arg1arg2arg3',
          'description',
          [ '0x0', '0x0', '0x0' ],
          [ '0x0', '0x0', '0x0' ],
          5,
          false
        )
      }
      let script = encodeCallScript([action])
      const scriptNewSpec = script.replace('0x00000001','0x00000002')
      return assertRevert(async () => {
        await app.newVote(scriptNewSpec, '', { from: holder50 })
      })
    })

    xit('can change minimum candidate support', async () => { })

    context('creating vote with normal distributions', () => {
      let voteId = {}
      let script = ''
      let candidateState
      let [ , , ...candidates ] = accounts.slice(0, 5)
      let [ apple, orange, banana ] = candidates

      before(async () => {
        let action = {
          to: executionTarget.address,
          calldata: executionTarget.contract.setSignal.getData(
            candidates,
            [ 0, 0, 0 ],
            [ 4, 4, 4 ],
            'arg1arg2arg3',
            'description',
            [ 0x1, 0x2, 0x3 ],
            [ 0x1, 0x2, 0x3 ],
            5,
            false
          )
        }

        script = encodeCallScript([action])
        let newvote = await app.newVote(script, 'metadata', { from: holder50 })
        voteId = getCreatedVoteId(newvote)
      })

      it('has correct vote ID', async () => {
        assert.equal(parseVoteIdToNumber(voteId), 7, 'DotVote should have been created')
      })

      it('stored the candidate addresses correctly', async () => {
        let appleState = (await app.getCandidate(
          voteId,
          candidates.indexOf(apple)
        ))
        let orangeState = (await app.getCandidate(
          voteId,
          candidates.indexOf(orange)
        ))
        let bananaState = (await app.getCandidate(
          voteId,
          candidates.indexOf(banana)
        ))
        assert.equal(
          appleState[0],
          apple,
          'apple address extracted incorrectly'
        )
        assert.equal(
          orangeState[0],
          orange,
          'orange address extracted incorrectly'
        )
        assert.equal(
          bananaState[0],
          banana,
          'banana address extracted incorrectly'
        )
      })
      it('has correct state', async () => {
        let voteState = await app.getVote(voteId)
        let tokenBalance = await token.totalSupply()
        assert.equal(voteState[0], true, 'is true')
        assert.equal(voteState[1], holder50, 'is holder50')
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
        // TODO: externalId returning as 3. Need sanity check to ensure if this s/b the case.
        // assert.equal(voteState[7].toNumber(), 3, 'is externalId')
        assert.equal(voteState[8], script, 'is script')
        assert.equal(voteState[9], false, 'is false')
      })

      it('holders cannot vote with more tokens than they possess', async () => {
        let vote = [ 6, 7, 7 ]
        let voter = holder19
        return assertRevert(async () => {
          await app.vote(voteId, vote, { from: voter })
        })
      })

      it('holder can vote', async () => {
        let vote = [ 1, 2, 3 ]
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

        let appleInfo = (await app.getCandidate(
          voteId,
          candidates.indexOf(apple)
        ))
        let orangeInfo = (await app.getCandidate(
          voteId,
          candidates.indexOf(orange)
        ))
        let bananaInfo = (await app.getCandidate(
          voteId,
          candidates.indexOf(banana)
        ))

        assert.equal(
          appleInfo[1].toNumber(),
          vote[0],
          'The correct amount of support should be logged for Apple'
        )
        assert.equal(
          orangeInfo[1].toNumber(),
          vote[1],
          'The correct amount of support should be logged for Orange'
        )
        assert.equal(
          bananaInfo[1].toNumber(),
          vote[2],
          'The correct amount of support should be logged for Banana'
        )
      })

      it('holders cannot modify a prior vote with more tokens than they possess', async () => {
        let vote = [ 6, 7, 7 ]
        let voter = holder19
        return assertRevert(async () => {
          await app.vote(voteId, vote, { from: voter })
        })
      })

      it('holder can modify vote without getting double-counted', async () => {
        // holder19's vote from two tests prior
        let voteOne = [ 1, 2, 3 ]
        let voteTwo = [ 6, 5, 4 ]

        let voter = holder31

        await app.vote(voteId, voteTwo, { from: voter })
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

        let appleInfo = (await app.getCandidate(
          voteId,
          candidates.indexOf(apple)
        ))
        let orangeInfo = (await app.getCandidate(
          voteId,
          candidates.indexOf(orange)
        ))
        let bananaInfo = (await app.getCandidate(
          voteId,
          candidates.indexOf(banana)
        ))

        assert.equal(
          appleInfo[1].toNumber(),
          voteOne[0] + voteTwo[0],
          'The correct amount of support should be logged for Apple'
        )
        assert.equal(
          orangeInfo[1].toNumber(),
          voteOne[1] + voteTwo[1],
          'The correct amount of support should be logged for Orange'
        )
        assert.equal(
          bananaInfo[1].toNumber(),
          voteOne[2] + voteTwo[2],
          'The correct amount of support should be logged for Banana'
        )
      })

      it('non-tokenholders cannot cast votes', async () => {
        let vote = [ 0, 0, 0 ]
        return assertRevert(async () => {
          await app.vote(voteId, vote, { from: nonHolder })
        })
      })

      it('token transfers dont affect DotVoting', async () => {
        let vote = [ 10, 9, 12 ]
        let voter = holder31
        await token.transfer(nonHolder, 31, { from: voter })
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
        await token.transfer(voter, 31, { from: nonHolder })
        const nonHolderBalance = new web3.BigNumber(await token.balanceOf(nonHolder)).toNumber()
        assert.strictEqual(nonHolderBalance, 0, 'nonHolder should not possess any tokens')
      })

      it('cannot execute during open vote', async () => {
        const canExecute = await app.canExecute(voteId)
        assert.equal(canExecute, false, 'canExecute should be false')
      })
      it('cannot execute if vote instance previously executed', async () => {
        let voteOne = [ 4, 15, 0 ]
        let voteTwo = [ 20, 10, 1 ]
        let voteThree = [ 30, 15, 5 ]
        await app.vote(voteId, voteOne, { from: holder19 })
        await app.vote(voteId, voteTwo, { from: holder31 })
        await app.vote(voteId, voteThree, { from: holder50 })
        timeTravel(DotVotingTime + 1)
        await app.executeVote(voteId)
        const canExecute = await app.canExecute(voteId)

        assert.equal(canExecute, false, 'canExecute should be false')
      })
      it('can execute if vote has sufficient candidate support', async () => {
        let newvote = await app.newVote(script, 'metadata', { from: holder50 })
        voteId = getCreatedVoteId(newvote)
        let voteOne = [ 4, 15, 0 ]
        let voteTwo = [ 20, 10, 1 ]
        let voteThree = [ 30, 15, 5 ]
        await app.vote(voteId, voteOne, { from: holder19 })
        await app.vote(voteId, voteTwo, { from: holder31 })
        await app.vote(voteId, voteThree, { from: holder50 })
        timeTravel(DotVotingTime + 1)
        const canExecute = await app.canExecute(voteId)

        assert.equal(canExecute, true, 'canExecute should be true')
      })
      it('cannot execute if vote has 0 candidate support', async () => {
        let newvote = await app.newVote(script, 'metadata', { from: holder50 })
        voteId = getCreatedVoteId(newvote)
        let voteOne = [ 0, 0, 0 ]
        let voteTwo = [ 0, 0, 0 ]
        let voteThree = [ 0, 0, 0 ]
        await app.vote(voteId, voteOne, { from: holder19 })
        await app.vote(voteId, voteTwo, { from: holder31 })
        await app.vote(voteId, voteThree, { from: holder50 })
        timeTravel(DotVotingTime + 1)
        const canExecute = await app.canExecute(voteId)
        assert.equal(canExecute, false, 'canExecute should be false')
      })
      it('cannot execute if vote has insufficient candidate support', async () => {
        let newvote = await app.newVote(script, 'metadata', { from: holder50 })
        voteId = getCreatedVoteId(newvote)
        let voteOne = [ 2, 17, 0 ]
        let voteTwo = [ 18, 12, 1 ]
        let voteThree = [ 30, 19, 1 ]
        await app.vote(voteId, voteOne, { from: holder19 })
        await app.vote(voteId, voteTwo, { from: holder31 })
        await app.vote(voteId, voteThree, { from: holder50 })
        timeTravel(DotVotingTime + 1)
        const canExecute = await app.canExecute(voteId)
        assert.equal(canExecute, false, 'canExecute should be false')
      })
      it('can execute vote if minimum participation (quorum) has been met', async () => {
        let newvote = await app.newVote(script, 'metadata', { from: holder50 })
        voteId = getCreatedVoteId(newvote)
        let voteOne = [ 10, 0, 0 ]
        let voteTwo = [ 0, 20, 0 ]
        let voteThree = [ 0, 0, 40 ]
        await app.vote(voteId, voteOne, { from: holder19 })
        await app.vote(voteId, voteTwo, { from: holder31 })
        await app.vote(voteId, voteThree, { from: holder50 })
        timeTravel(DotVotingTime + 1)
        const canExecute = await app.canExecute(voteId)
        assert.equal(canExecute, true, 'canExecute should be true')
      })
      it('cannot execute vote if minimum participation (quorum) not met', async () => {
        let newvote = await app.newVote(script, 'metadata', { from: holder50 })
        voteId = getCreatedVoteId(newvote)
        let voteOne = [ 10, 0, 0 ]
        let voteTwo = [ 0, 9, 0 ]
        let voteThree = [ 0, 0, 10 ]
        await app.vote(voteId, voteOne, { from: holder19 })
        await app.vote(voteId, voteTwo, { from: holder31 })
        await app.vote(voteId, voteThree, { from: holder50 })
        timeTravel(DotVotingTime + 1)
        const canExecute = await app.canExecute(voteId)
        assert.equal(canExecute, false, 'canExecute should be false')
      })
      it('holder can add candidates', async () => {
        let newvote = await app.newVote(script, 'metadata', { from: holder50 })
        voteId = getCreatedVoteId(newvote)
        mango = accounts[5]

        const fourCandidates = [ ...candidates, mango ]

        await app.addCandidate(voteId, '0xbeefdead', mango, 0x1, 0x1)
        candidateState = await app.getCandidate(
          voteId,
          fourCandidates.indexOf(mango)
        )
        assert.equal(
          candidateState[0],
          mango,
          'Candidate should have been added'
        )
        assert.equal(
          candidateState[1].toNumber(),
          0,
          'Support should start at 0'
        )
      })
      it('holder cannot add duplicate candidate', async () => {
        mango = accounts[5]
        return assertRevert(async () => {
          await app.addCandidate(voteId, '0xbeefdead', mango, 0x1, 0x1)
        })
      })
      it('holder can get total number of candidates', async () => {
        const totalcandidates = await app.getCandidateLength(voteId)
        assert.equal(
          totalcandidates.toNumber(),
          4,
          'candidate array length is incorrect'
        )
      })
      it('holder can get vote metadata', async () => {
        const metadata = await app.getVoteMetadata(voteId)
        assert.equal(
          metadata,
          'metadata',
          'Vote has metadata'
        )
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
          book.address,
          token.address,
          minimumParticipation,
          candidateSupportPct,
          DotVotingTime
        )
      })
    })

    it('fails if min candidate support is greater than min participation', () => {
      const minimumParticipation = pct16(20)
      const candidateSupportPct = pct16(50)
      return assertRevert(async () => {
        await app.initialize(
          book.address,
          token.address,
          minimumParticipation,
          candidateSupportPct,
          DotVotingTime
        )
      })
    })

    it('fails if min participation is greater than 100', () => {
      const minimumParticipation = pct16(101)
      const candidateSupportPct = pct16(20)
      return assertRevert(async () => {
        await app.initialize(
          book.address,
          token.address,
          minimumParticipation,
          candidateSupportPct,
          DotVotingTime
        )
      })
    })
  })
})
