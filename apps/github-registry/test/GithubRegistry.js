
const { assertRevert } = require('../test-helpers/assertThrow')
const getBlockNumber = require('../test-helpers/blockNumber')(web3)
const timeTravel = require('../test-helpers/timeTravel')(web3)
const { encodeCallScript, EMPTY_SCRIPT } = require('../test-helpers/evmScript')
const ExecutionTarget = artifacts.require('ExecutionTarget')

const GithubRegistry = artifacts.require('GithubRegistry')
const MiniMeToken = artifacts.require('@aragon/os/contracts/lib/minime/MiniMeToken')
const DAOFactory = artifacts.require('@aragon/os/contracts/factory/DAOFactory')
const EVMScriptRegistryFactory = artifacts.require('@aragon/os/contracts/factory/EVMScriptRegistryFactory')
const ACL = artifacts.require('@aragon/os/contracts/acl/ACL')
const Kernel = artifacts.require('@aragon/os/contracts/kernel/Kernel')

const getContract = name => artifacts.require(name)
const pct16 = x => new web3.BigNumber(x).times(new web3.BigNumber(10).toPower(16))
const createdVoteId = receipt => receipt.logs.filter(x => x.event == 'StartVote')[0].args.voteId
const getRepoId = receipt => receipt.logs.filter(x => x.event == 'RepoAdded')[0].args._id

const ANY_ADDR = ' 0xffffffffffffffffffffffffffffffffffffffff'


contract('Github Registry App', function (accounts) {
    let daoFact, app, token, executionTarget = {}

    const RangeVotingTime = 1000
    const root = accounts[0]

    before(async () => {
        //Create Base DAO Contracts
        const kernelBase = await getContract('Kernel').new()
        const aclBase = await getContract('ACL').new()
        const regFact = await EVMScriptRegistryFactory.new()
        daoFact = await DAOFactory.new(kernelBase.address, aclBase.address, regFact.address)
    })

    beforeEach(async () => {
        //Deploy Base DAO Contracts
        const r = await daoFact.newDAO(root)
        const dao = Kernel.at(r.logs.filter(l => l.event == 'DeployDAO')[0].args.dao)
        const acl = ACL.at(await dao.acl())

        //Create DAO admin role
        await acl.createPermission(root, dao.address, await dao.APP_MANAGER_ROLE(), root, { from: root })
        
        //Deploy Contract to be tested
        const receipt = await dao.newAppInstance('0x1234', (await GithubRegistry.new()).address, { from: root })
        app = GithubRegistry.at(receipt.logs.filter(l => l.event == 'NewAppProxy')[0].args.proxy)

        //create ACL permissions
        await acl.createPermission(ANY_ADDR, app.address, await app.ADD_ENTRY_ROLE(), root, { from: root })
        await acl.createPermission(ANY_ADDR, app.address, await app.REMOVE_ENTRY_ROLE(), root, { from: root })
        await acl.createPermission(ANY_ADDR, app.address, await app.ADD_BOUNTY_ROLE(), root, { from: root })
    })

    context('creating and retrieving repos', function () {
        it('creates a repo entry and returns the generated repoID', async function () {
            repoOwner = accounts[0]
            expectedID = web3.sha3('abc', '123')
            repoID = (await app.addRepo('abc', String(123))).logs.filter(x => x.event == 'RepoAdded')[0].args.id
            assert.equal(repoID, '0x779b71f95cca231dba9830306e5e888357c053f5c4b9294c41fd3b10a8a1f101', 'repo is created and hashed ID is returned')
        })
    })

    
})
