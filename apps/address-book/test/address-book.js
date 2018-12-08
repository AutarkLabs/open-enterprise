const {
  ACL,
  DAOFactory,
  EVMScriptRegistryFactory,
  Kernel,
} = require('@tps/test-helpers/artifacts')

const AddressBook = artifacts.require('AddressBook')
const { assertRevert } = require('@tps/test-helpers/assertThrow')

const getContract = name => artifacts.require(name)

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
  })

  before(async () => {
    const kernelBase = await getContract('Kernel').new(true)
    const aclBase = await getContract('ACL').new()
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

  context('main context', async () => {
    let starfleet = accounts[0]
    let jeanluc = accounts[1]
    let borg = accounts[2]
    let receipt

    describe('add to and get from addressbook', async () => {
      beforeEach(async () => {
        receipt = await app.addEntry(starfleet, 'Starfleet', 'Group')
      })
      it('emit the address in the event', async () => {
        assert.equal(
          receipt.logs.filter(l => l.event == 'EntryAdded')[0].args.addr,
          starfleet,
          'event emitted should have correct address'
        )
      })
      it('get the entry fields', async () => {
        await app.addEntry(jeanluc, 'Jean-Luc Picard', 'Individual')
        await app.addEntry(borg, 'Borg', 'N/A')
        entry1 = await app.getEntry(starfleet)
        entry2 = await app.getEntry(jeanluc)
        entry3 = await app.getEntry(borg)
        assert.equal(entry1[0], starfleet)
        assert.equal(entry1[1], 'Starfleet')
        assert.equal(entry1[2], 'Group')
        assert.equal(entry2[0], jeanluc)
        assert.equal(entry2[1], 'Jean-Luc Picard')
        assert.equal(entry2[2], 'Individual')
        assert.equal(entry3[0], borg)
        assert.equal(entry3[1], 'Borg')
        assert.equal(entry3[2], 'N/A')
      })
    })
    it('should revert when repeating a name', async () => {
      assertRevert(app.addEntry(borg, 'Borg', 'N/A'))
    })
    it('remove entry from addressbook', async () => {
      await app.removeEntry(borg)
      entry3 = await app.getEntry(borg)
      assert.notEqual(entry3[0], borg)
      assert.notEqual(entry3[1], 'Borg')
      assert.notEqual(entry3[2], 'N/A')
    })
  })
})
