const {
  ACL,
  DAOFactory,
  EVMScriptRegistryFactory,
  Kernel,
  MiniMeToken
} = require('@tps/test-helpers/artifacts')

//const DotVoting = artifacts.require('DotVotingMock')
//const ExecutionTarget = artifacts.require('ExecutionTarget')
const RewardToken = artifacts.require('RewardToken')

const { assertRevert } = require('@tps/test-helpers/assertThrow')
const { encodeCallScript } = require('@tps/test-helpers/evmScript')
const timeTravel = require('@tps/test-helpers/timeTravel')(web3)

const pct16 = x =>
  new web3.BigNumber(x).times(new web3.BigNumber(10).toPower(16))
const createdVoteId = receipt =>
  receipt.logs.filter(x => x.event === 'StartVote')[0].args.voteId

const castedVoteId = receipt =>
  receipt.logs.filter(x => x.event === 'CastVote')[0].args.voteId

const ANY_ADDR = '0xffffffffffffffffffffffffffffffffffffffff'
const NULL_ADDRESS = '0x00'

contract('Rewards Token', accounts => {
  let token = {}
  const root = accounts[0]
  holder1 = accounts[1]
  holder2 = accounts[2]
  holder3 = accounts[3]

  beforeEach(async () => {
    token = await RewardToken.new()
    await token.mint(holder1, 50e18,)
  })
/*
  it('receives rewards', async () => {
    await token.addReward({from: root, value: web3.toWei(1, 'ether')})

  })

  // first test stable supply cases
  // then test fluctuating supply (just increasing supply for now)

  // Stable Supply Test Cases
  // A. script
  // 1. mint to single user
  // 2. add reward
  // 3. withdraw for single user should get full reward
  // 4. mint tokens for second user
  // 5. repeat 2 and 3

  // test a case where a transfer occurs after a reward is added
  // but before any rewards are withdrawn

  // 1. add reward
  // 2. claim reward with one user
  // 3. do transfer
  // 4. reclaim rewards with both users. (What happens?)
})


contract('Rewards App', accounts => {
  let daoFact = {}
  let app = {}
  let token = {}
  //let executionTarget = {}

  //const DotVotingTime = 1000
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
    // read: https://github.com/AutarkLabs/planning-suite/pull/243
    const receipt = await dao.newAppInstance(
      '0x1234',
      (await Rewards.new()).address,
      0x0,
      false,
      { from: root }
    )

    app = Rewards.at(
      receipt.logs.filter(l => l.event === 'NewAppProxy')[0].args.proxy
    )

    //await acl.createPermission(
    //  ANY_ADDR,
    //  app.address,
    //  await app.CREATE_VOTES_ROLE(),
    //  root,
    //  { from: root }
    //)
    //await acl.createPermission(
    //  ANY_ADDR,
    //  app.address,
    //  await app.ADD_CANDIDATES_ROLE(),
    //  root,
    //  { from: root }
    //)
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
        DotVotingTime
      )

      //executionTarget = await ExecutionTarget.new()
    })


  })
  */
})
