/* global artifacts contract before beforeEach it assert */
const { assertRevert } = require('@aragon/test-helpers/assertThrow')

const Storage = artifacts.require('Storage.sol')
const DAOFactory = artifacts.require(
  '@aragon/os/contracts/factory/DAOFactory'
)
const EVMScriptRegistryFactory = artifacts.require(
  '@aragon/os/contracts/factory/EVMScriptRegistryFactory'
)
const ACL = artifacts.require('@aragon/os/contracts/acl/ACL')
const Kernel = artifacts.require('@aragon/os/contracts/kernel/Kernel')

const getContract = name => artifacts.require(name)

const ANY_ADDRESS = '0xffffffffffffffffffffffffffffffffffffffff'

contract('Storage', accounts => {
  let APP_MANAGER_ROLE, REGISTER_DATA_ROLE
  let daoFact, appBase, app

  const firstAccount = accounts[0]
  const secondAccount = accounts[1]

  before(async () => {
    const kernelBase = await getContract('Kernel').new(true) // petrify immediately
    const aclBase = await getContract('ACL').new()
    const regFact = await EVMScriptRegistryFactory.new()
    daoFact = await DAOFactory.new(
      kernelBase.address,
      aclBase.address,
      regFact.address
    )
    appBase = await Storage.new()

    // Setup constants
    APP_MANAGER_ROLE = await kernelBase.APP_MANAGER_ROLE()
    REGISTER_DATA_ROLE = await appBase.REGISTER_DATA_ROLE()
  })

  beforeEach(async () => {
    const daoReceipt = await daoFact.newDAO(firstAccount)
    const dao = Kernel.at(
      daoReceipt.logs.filter(l => l.event === 'DeployDAO')[0].args.dao
    )
    const acl = ACL.at(await dao.acl())

    await acl.createPermission(
      firstAccount,
      dao.address,
      APP_MANAGER_ROLE,
      firstAccount,
      {
        from: firstAccount,
      }
    )

    const receipt = await dao.newAppInstance(
      '0x1234',
      appBase.address,
      '0x',
      false,
      { from: firstAccount }
    )

    app = Storage.at(
      receipt.logs.filter(l => l.event === 'NewAppProxy')[0].args.proxy
    )

    await acl.createPermission(
      ANY_ADDRESS,
      app.address,
      REGISTER_DATA_ROLE,
      firstAccount,
      {
        from: firstAccount,
      }
    )
  })

  it('should set a key-value pair for home app', async () => {
    app.initialize()
    await app.registerData(0x1e, '0xdeadcow', { from: firstAccount })
    assert.equal(await app.getRegisteredData(0x1e), '0xdeadcow')
  })
})
