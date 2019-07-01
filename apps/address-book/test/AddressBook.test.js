const { assertRevert } = require('@aragon/test-helpers/assertThrow')

/** Helper function to import truffle contract artifacts */
const getContract = name => artifacts.require(name)

/** Helper function to read events from receipts */
const getReceipt = (receipt, event, arg) => receipt.logs.filter(l => l.event === event)[0].args[arg]

/** Useful constants */
const ANY_ADDRESS = '0xffffffffffffffffffffffffffffffffffffffff'
const exampleCid = 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco'

contract('AddressBook', accounts => {
  let APP_MANAGER_ROLE, ADD_ENTRY_ROLE, REMOVE_ENTRY_ROLE
  let daoFact, app, appBase

  // Setup test actor accounts
  const root = accounts[0]

  before(async () => {
    // Create Base DAO and App contracts
    const kernelBase = await getContract('Kernel').new(true) // petrify immediately
    const aclBase = await getContract('ACL').new()
    const regFact = await getContract('EVMScriptRegistryFactory').new()
    daoFact = await getContract('DAOFactory').new(
      kernelBase.address,
      aclBase.address,
      regFact.address
    )
    appBase = await getContract('AddressBook').new()

    // Setup ACL roles constants
    APP_MANAGER_ROLE = await kernelBase.APP_MANAGER_ROLE()
    ADD_ENTRY_ROLE = await appBase.ADD_ENTRY_ROLE()
    REMOVE_ENTRY_ROLE = await appBase.REMOVE_ENTRY_ROLE()

    /** Create the dao from the dao factory */
    const daoReceipt = await daoFact.newDAO(root)
    const dao = getContract('Kernel').at(getReceipt(daoReceipt, 'DeployDAO', 'dao'))

    /** Setup permission to install app */
    const acl = getContract('ACL').at(await dao.acl())
    await acl.createPermission(root, dao.address, APP_MANAGER_ROLE, root)

    /** Install an app instance to the dao */
    const appReceipt = await dao.newAppInstance('0x1234', appBase.address, '0x', false)
    app = getContract('AddressBook').at(getReceipt(appReceipt, 'NewAppProxy', 'proxy'))

    /** Setup permission to create address entries */
    await acl.createPermission(ANY_ADDRESS, app.address, ADD_ENTRY_ROLE, root)

    /** Setup permission to remove address entries */
    await acl.createPermission(ANY_ADDRESS, app.address, REMOVE_ENTRY_ROLE, root)

    /** Initialize app */
    await app.initialize()
  })

  context('main context', () => {
    let starfleet = accounts[0]

    it('should add a new entry', async () => {
      const receipt = await app.addEntry(starfleet, exampleCid)
      const addedAddress = receipt.logs.filter(l => l.event == 'EntryAdded')[0]
        .args.addr
      assert.equal(addedAddress, starfleet)
    })

    it('should get the previously added entry', async () => {
      entry1 = await app.getEntry(starfleet)
      assert.equal(entry1, exampleCid)
    })

    it('should remove the previously added entry', async () => {
      await app.removeEntry(starfleet)
    })

    it('should allow to re-add same address from previously removed entry', async () => {
      await app.addEntry(starfleet, exampleCid)
    })
  })

  context('invalid operations', () => {
    const [ borg, jeanluc, bates ] = accounts.splice(1, 3)
    before(async () => {
      app.addEntry(borg, exampleCid)
    })

    it('should revert when adding duplicate address', async () => {
      return assertRevert(async () => {
        await app.addEntry(borg, exampleCid)
      })
    })

    it('should revert when removing not existent entry', async () => {
      return assertRevert(async () => {
        await app.removeEntry(jeanluc)
      })
    })

    it('should revert when a CID =/= 46 chars', async () => {
      return assertRevert(async () => {
        await app.addEntry(bates, 'test_CID')
      })
    })

    it('should revert when getting non-existent entry', async () => {
      return assertRevert(async () => {
        await app.getEntry(jeanluc)
      })
    })
  })
})
