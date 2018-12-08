const {
  ACL,
  DAOFactory,
  EVMScriptRegistryFactory,
  Kernel
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
      accounts[0],
      app.address,
      await app.ADD_ENTRY_ROLE(),
      root,
      { from: root }
    )
    await acl.createPermission(
      accounts[0],
      app.address,
      await app.REMOVE_ENTRY_ROLE(),
      root,
      { from: root }
    )
  })

  context('main context', () => {
    let starfleet = accounts[0]
    let jeanluc = accounts[1]
    let borg = accounts[2]

    it('add to and get from addressbook', async () => {
      await app.addEntry(starfleet, 'Starfleet', 'Group')
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

    it('remove entry from addressbook', async () => {
      await app.removeEntry(borg)
      entry3 = await app.getEntry(borg)
      assert.notEqual(entry3[0], borg)
      assert.notEqual(entry3[1], 'Borg')
      assert.notEqual(entry3[2], 'N/A')
    })

    context('invalid operations', () => {
      it('should revert when adding an entry for repeated name', async () => {
        return assertRevert(async () => {
          await app.addEntry(borg, 'Starfleet', 'Group')
          'name already in use'
        })
      })

      it('should revert when adding an entry by unauthorized address', async () => {
        assertRevert(async () => {
          await app.addEntry(borg, 'Borg', 'N/A', { from: borg }),
          'does not have addEntry authorization'
        })
      })

      it('should revert when removing an entry by unauthorized address', async () => {
        assertRevert(async () => {
          await app.removeEntry(starfleet, { from: borg }),
          'does not have removeEntry authorization'
        })
      })
    })
  })
})

