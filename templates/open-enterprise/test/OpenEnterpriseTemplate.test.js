/* eslint-disable no-console */
/* global artifacts, before, context, contract, it */

// const { getTemplateAddress } = require('../temp/lib/ens')(web3, artifacts)
const { randomId } = require('@aragon/templates-shared/helpers/aragonId')

const { APPS } = require('../temp/helpers/apps')

const namehash = require('eth-ens-namehash').hash
const promisify = require('util').promisify
const exec = promisify(require('child_process').exec)
const keccak256 = require('js-sha3').keccak_256

/** Helper function to import truffle contract artifacts */
const getContract = name => artifacts.require(name)

/** Helper function to read events from receipts */
const getReceipt = (receipt, event, arg) => {
  const result = receipt.logs.filter(l => l.event === event)[0].args
  return arg ? result[arg] : result
}

const ONE_DAY = 60 * 60 * 24
const ONE_WEEK = ONE_DAY * 7
const THIRTY_DAYS = ONE_DAY * 30

contract('OpenEnterpriseTemplate', ([ owner, member1, member2, member3 ]) => {
  const DAO_ID = randomId()
  const TOKEN1_NAME = 'DaoToken1'
  const TOKEN1_SYMBOL = 'DT1'
  const TOKEN2_NAME = 'DaoToken2'
  const TOKEN2_SYMBOL = 'DT2'
  const VOTING_BOOLS = [ false, false ]
  const TOKEN_TRANSFERABLE = false
  const TOKENS_LIMIT = true
  const TOKEN_HOLDERS = [ member1, member2, member3 ]
  const TOKEN_STAKES = [ 100, 200, 500 ]
  const TOKEN_BOOLS = [ TOKEN_TRANSFERABLE, TOKENS_LIMIT ]

  const VOTE_DURATION = ONE_WEEK
  const SUPPORT_REQUIRED = 50e16
  const MIN_ACCEPTANCE_QUORUM = 20e16
  const A1_VOTING_SETTINGS = [ SUPPORT_REQUIRED, MIN_ACCEPTANCE_QUORUM, VOTE_DURATION ]
  const DOT_VOTING_SETTINGS = [ SUPPORT_REQUIRED, MIN_ACCEPTANCE_QUORUM, VOTE_DURATION ]
  const VOTING_SETTINGS = [ ...DOT_VOTING_SETTINGS, ...A1_VOTING_SETTINGS ]
  const FINANCE_PERIOD = THIRTY_DAYS

  let template

  // before('fetch open enterprise template', async () => {
  //   template = getContract('OpenEnterpriseTemplate').at(await getTemplateAddress())
  // })

  before('deploy required contract dependencies', async () => {
    // TODO: move these deployments to an external helper, reusable by other apps
    // TODO: make console.logs optional with a verbose option
    // Deploy StandardBounties
    // TODO: separate test and coverage environments with env variable!
    // console.log((await exec('pwd')).stdout)
    console.log('Are we in solc coverage?', process.env.SOLIDITY_COVERAGE ? 'yes' : 'no')

    const bountiesAddress = process.env.SOLIDITY_COVERAGE ?
      (await exec('cd ../../../shared/integrations/StandardBounties && npm run migrate:coverage | tail -n 1')).stdout.trim() :
      (await exec('cd ../../shared/integrations/StandardBounties && npm run migrate | tail -n 1')).stdout.trim()
    if (!bountiesAddress) {
      throw new Error('StandardBounties deployment failed, the test cannot continue')
    }
    console.log('       Deployed StandardBounties at', bountiesAddress)

    // Deploy ENS
    const ensFactBase = await getContract('ENSFactory').new()
    const ensReceipt = await ensFactBase.newENS(owner)
    const ens = getContract('ENS').at(getReceipt(ensReceipt, 'DeployENS', 'ens'))
    console.log('       Deployed ENS at', ens.address)

    // Deploy DaoFactory
    const kernelBase = await getContract('Kernel').new(true) // petrify immediately
    const aclBase = await getContract('ACL').new()
    const regFactBase = await getContract('EVMScriptRegistryFactory').new()
    const daoFactBase = await getContract('DAOFactory').new(
      kernelBase.address,
      aclBase.address,
      regFactBase.address
    )
    console.log('       Deployed DAOFactory at', daoFactBase.address)

    // Deploy MiniMeTokenFactory
    const miniMeFactoryBase = await getContract('MiniMeTokenFactory').new()
    console.log('       Deployed MiniMeTokenFactory at', miniMeFactoryBase.address)

    // Deploy AragonID
    const publicResolver = await ens.resolver(namehash('resolver.eth'))
    const tld = namehash('eth')
    const label = '0x'+keccak256('aragonid')
    const node = namehash('aragonid.eth')
    const aragonID = await getContract('FIFSResolvingRegistrar').new(ens.address, publicResolver, node)
    console.log('       Deployed AragonID at', aragonID.address)
    // Configure AragonID
    // await ens.setOwner(node, aragonID.address)
    await ens.setSubnodeOwner(tld, label, aragonID.address)
    // await aragonID.register('0x'+keccak256('owner'), owner)

    // Deploy APM
    const tldName = 'eth'
    const labelName = 'aragonpm'
    const tldHash = namehash(tldName)
    const labelHash = '0x'+keccak256(labelName)
    // const apmNode = namehash(`${labelName}.${tldName}`)

    const apmRegistryBase = await getContract('APMRegistry').new()
    const apmRepoBase = await getContract('Repo').new()
    const ensSubdomainRegistrarBase = await getContract('ENSSubdomainRegistrar').new()
    const apmFactory = await getContract('APMRegistryFactory').new(
      daoFactBase.address,
      apmRegistryBase.address,
      apmRepoBase.address,
      ensSubdomainRegistrarBase.address,
      ens.address,
      ensFactBase.address
    )
    // Assign ENS name (${labelName}.${tldName}) to factory...
    // await ens.setOwner(apmNode, apmFactory.address)
    // Create subdomain and assigning it to APMRegistryFactory
    await ens.setSubnodeOwner(tldHash, labelHash, apmFactory.address)
    // TODO: Transferring name ownership from deployer to APMRegistryFactory
    const apmReceipt = await apmFactory.newAPM(tldHash, labelHash, owner)
    const apm = getContract('APMRegistry').at(getReceipt(apmReceipt, 'DeployAPM', 'apm'))
    console.log('       Deployed APM at', apm.address)

    // Register apps
    for (const { name, contractName } of APPS) {
      const appBase = await getContract(contractName).new()
      console.log(`       Registering package for ${appBase.constructor.contractName} as "${name}.aragonpm.eth"`)
      await apm.newRepoWithVersion(name, owner, [ 1, 0, 0 ], appBase.address, '')
    }


    // Deploy OpenEnterpriseTemplate
    const baseContracts = [ daoFactBase.address, ens.address, miniMeFactoryBase.address, aragonID.address, bountiesAddress ]
    template = await getContract('OpenEnterpriseTemplate').new(baseContracts)
    console.log('       Deployed OpenEnterpriseTemplate at', template.address)
    console.log('\n       ===== Deployments completed =====\n')
  })

  context('dao instantiation', () => {
    it('should run newTokensAndInstance without error', async () => {
      await template.newTokensAndInstance(
        DAO_ID,
        TOKEN1_NAME,
        TOKEN1_SYMBOL,
        TOKEN2_NAME,
        TOKEN2_SYMBOL,
        VOTING_SETTINGS,
        VOTING_BOOLS
      )
    })

    it('should run newTokenManagers without error', async () => {
      await template.newTokenManagers(
        TOKEN_HOLDERS,
        TOKEN_STAKES,
        TOKEN_HOLDERS,
        TOKEN_STAKES,
        TOKEN_BOOLS
      )
    })

    it('should run finalizeDao without error', async () => {
      await template.finalizeDao(
        [ FINANCE_PERIOD, FINANCE_PERIOD ],
        false
      )
    })

    it('should cost below gas limit', () => {

    })

  })
})