const {
    ACL,
    DAOFactory,
    Vault,
    Kernel,
    MiniMeToken
  } = require('@tps/test-helpers/artifacts')
  
  //const RangeVoting = artifacts.require('RangeVotingMock')
  //const ExecutionTarget = artifacts.require('ExecutionTarget')
  const Rewards = artifacts.require('RewardsCore')
  
  const { assertRevert } = require('@tps/test-helpers/assertThrow')
  const { encodeCallScript } = require('@tps/test-helpers/evmScript')
  const timeTravel = require('@tps/test-helpers/timeTravel')(web3)
  
  const ANY_ADDR = '0xffffffffffffffffffffffffffffffffffffffff'
  const NULL_ADDRESS = '0x00'
  
  contract('Rewards App', accounts => {
    let daoFact = {}
    let app = {}
    let token = {}
  
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
  
    })
  
  })
  