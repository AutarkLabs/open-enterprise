const {
  ACL,
  DAOFactory,
  EVMScriptRegistryFactory,
  Kernel,
} = require('@tps/test-helpers/artifacts')

const AddressBook = artifacts.require('AddressBook')

const { assertRevert } = require('@tps/test-helpers/assertThrow')

const ANY_ADDR = ' 0xffffffffffffffffffffffffffffffffffffffff'

contract('AddressBook App', accounts => {
  let daoFact = {},
    app = {}

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

    const receipt = await dao.newAppInstance(
      '0x1234',
      (await AddressBook.new()).address,
      0x0,
      false,
      { from: root }
    )
    app = AddressBook.at(
      receipt.logs.filter(l => l.event == 'NewAppProxy')[0].args.proxy
    )

    await app.initialize()

    await acl.createPermission(
      ANY_ADDR,
      app.address,
      await app.ADD_ENTRY_ROLE(),
      root,
      { from: root }
    )
    await acl.createPermission(
      ANY_ADDR,
      app.address,
      await app.REMOVE_ENTRY_ROLE(),
      root,
      { from: root }
    )
  })

  context('main context', () => {
    let starfleet = accounts[0]

    it('should add a new entry', async () => {
      const receipt = await app.addEntry(starfleet, 'Starfleet', 'Group')
      const addedAddress = receipt.logs.filter(l => l.event == 'EntryAdded')[0]
        .args.addr
      assert.equal(addedAddress, starfleet)
    })
    it('should get the previously added entry', async () => {
      entry1 = await app.getEntry(starfleet)
      assert.equal(entry1[0], starfleet)
      assert.equal(entry1[1], 'Starfleet')
      assert.equal(entry1[2], 'Group')
    })
    it('should remove the previously added entry', async () => {
      await app.removeEntry(starfleet)
    })
    it('should allow to use the same name from previously removed entry', async () => {
      await app.addEntry(accounts[1], 'Starfleet', 'Dejavu')
    })
    it('should allow to use the same address from previously removed entry', async () => {
      await app.addEntry(starfleet, 'NewStar', 'Dejavu')
    })
  })
  context('invalid operations', () => {
    let [ borg, jeanluc ] = accounts.splice(1, 2)
    before(async () => {
      app.addEntry(borg, 'Borg', 'Individual')
    })

    it('should revert when adding duplicate address', async () => {
      return assertRevert(async () => {
        await app.addEntry(borg, 'Burg', 'N/A')
      })
    })
    it('should revert when adding duplicate name', async () => {
      return assertRevert(async () => {
        await app.addEntry(jeanluc, 'Borg', 'Captain')
      })
    })
    it('should revert when removing not existant entry', async () => {
      return assertRevert(async () => {
        await app.removeEntry(jeanluc)
      })
    })
    it('should return a zero-address when getting non-existant entry', async () => {
      const [ entryAddress, name, entryType ] = await app.getEntry(jeanluc)
      assert.strictEqual(entryAddress, '0x0000000000000000000000000000000000000000', 'address should be 0x0')
      assert.strictEqual(name, '', 'name should be empty')
      assert.strictEqual(entryType, '', 'entry Type should be empty')
    })
  })
})
