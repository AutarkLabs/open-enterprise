/* global artifact, ... */
const {
  ACL,
  DAOFactory,
  EVMScriptRegistryFactory,
  Kernel,
} = require('@tpt/test-helpers/artifacts')

const {
  encodeCallScript,
  EMPTY_SCRIPT,
} = require('@tpt/test-helpers/evmScript')

const AddressBook = artifacts.require('AddressBook')

const getContract = name => artifacts.require(name)

const addedEntry = receipt =>
  receipt.logs.filter(x => x.event === 'EntryAdded')[0].args.addr

const removedEntry = receipt =>
  receipt.logs.filter(x => x.event === 'EntryRemoved')[0].args.addr

const ANY_ADDR = ' 0xffffffffffffffffffffffffffffffffffffffff'

contract('AddressBook App', accounts => {
  let daoFact,
    app,
    token,
    executionTarget = {}

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
    let jeanluc = accounts[1]
    let borg = accounts[2]

    before(async () => {
    })

    beforeEach(async () => {
    })

    it('add entry to addressbook', async () => {
      // TODO: debug ACL permissions
      // symptom: add() throws VM exception with auth(ADD_ENTRY_ROLE) uncommented
      // diagnosis: permissions for ADD_ENTRY_ROLE not being set correctly 
      let entry0 = addedEntry(
        await app.add(starfleet, 'Starfleet', 'Group', { from: starfleet })
      )
      let entry1 = addedEntry(
        await app.add(jeanluc, 'Jean-Luc Picard', 'Individual', { from: starfleet })
      )
      let entry2 = addedEntry(
        await app.add(borg, 'Borg', 'N/A', { from: starfleet })
      )
      assert.equal(entry0, starfleet, 'An entry should be added')
      assert.equal(entry1, jeanluc, 'An entry should be added')
      assert.equal(entry2, borg, 'An entry should be added')
    })

    it('get entry from addressbook', async () => {
      await app.add(starfleet, 'Starfleet', 'Group', { from: starfleet })
      await app.add(jeanluc, 'Jean-Luc Picard', 'Individual', { from: starfleet })
      await app.add(borg, 'Borg', 'N/A', { from: starfleet })
      let entry0 = await app.get(starfleet)
      let entry1 = await app.get(jeanluc)
      let entry2 = await app.get(borg)
      assert.equal(entry0[0], starfleet)
      assert.equal(entry0[1], 'Starfleet')
      assert.equal(entry0[2], 'Group')
      assert.equal(entry1[0], jeanluc)
      assert.equal(entry1[1], 'Jean-Luc Picard')
      assert.equal(entry1[2], 'Individual')
      assert.equal(entry2[0], borg)
      assert.equal(entry2[1], 'Borg')
      assert.equal(entry2[2], 'N/A')
    })

    it('remove entry from addressbook', async () => {
      // TODO: debug ACL permissions
      // symptom: remove() throws VM exception with auth(REMOVE_ENTRY_ROLE) uncommented
      // diagnosis: permissions for REMOVE_ENTRY_ROLE not being set correctly 
      await app.add(starfleet, 'Starfleet', 'Group', { from: starfleet })
      await app.add(jeanluc, 'Jean-Luc Picard', 'Individual', { from: starfleet })
      let entry2 = removedEntry(
        await app.remove(borg, { from: starfleet })
      )
      assert.equal(entry2, borg, 'An entry should be removed')
      entry0 = await app.get(starfleet)
      entry1 = await app.get(jeanluc)
      assert.equal(entry0[0], starfleet)
      assert.equal(entry0[1], 'Starfleet')
      assert.equal(entry0[2], 'Group')
      assert.equal(entry1[0], jeanluc)
      assert.equal(entry1[1], 'Jean-Luc Picard')
      assert.equal(entry1[2], 'Individual')
      entry2 = await app.get(borg)
      assert.notEqual(entry2[0], borg)
      assert.notEqual(entry2[1], 'Borg')
      assert.notEqual(entry2[2], 'N/A')
    })
  })
})
