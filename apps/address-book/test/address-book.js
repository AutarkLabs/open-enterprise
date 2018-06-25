const { assertRevert } = require('../test-helpers/assertThrow')
const getBlockNumber = require('../test-helpers/blockNumber')(web3)
const timeTravel = require('../test-helpers/timeTravel')(web3)
const { encodeCallScript, EMPTY_SCRIPT } = require('../test-helpers/evmScript')
const ExecutionTarget = artifacts.require('ExecutionTarget')

const AddressBook = artifacts.require("./AddressBook.sol");

const DAOFactory = artifacts.require('@aragon/os/contracts/factory/DAOFactory')
const EVMScriptRegistryFactory = artifacts.require('@aragon/os/contracts/factory/EVMScriptRegistryFactory')
const ACL = artifacts.require('@aragon/os/contracts/acl/ACL')
const Kernel = artifacts.require('@aragon/os/contracts/kernel/Kernel')

const getContract = name => artifacts.require(name)

const ANY_ADDR = ' 0xffffffffffffffffffffffffffffffffffffffff'


contract('AddressBook App', accounts => {
    let daoFact, app, token, executionTarget = {}

    const root = accounts[0]

    before(async () => {
        const kernelBase = await getContract('Kernel').new()
        const aclBase = await getContract('ACL').new()
        const regFact = await EVMScriptRegistryFactory.new()
        daoFact = await DAOFactory.new(kernelBase.address, aclBase.address, regFact.address)
    })

    beforeEach(async () => {
        const r = await daoFact.newDAO(root)
        const dao = Kernel.at(r.logs.filter(l => l.event == 'DeployDAO')[0].args.dao)
        const acl = ACL.at(await dao.acl())

        await acl.createPermission(root, dao.address, await dao.APP_MANAGER_ROLE(), root, { from: root })

        const receipt = await dao.newAppInstance('0x1234', (await AddressBook.new()).address, { from: root })
        app = AddressBook.at(receipt.logs.filter(l => l.event == 'NewAppProxy')[0].args.proxy)

        await acl.createPermission(ANY_ADDR, app.address, await app.ADD_ENTRY_ROLE(), root, { from: root })
        await acl.createPermission(ANY_ADDR, app.address, await app.REMOVE_ENTRY_ROLE(), root, { from: root })
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
            app.add(starfleet, "Starfleet", "Group")
            app.add(jeanluc, "Jean-Luc Picard", "Individual")
            app.add(borg, "Borg", "N/A")

        })
    })
})
