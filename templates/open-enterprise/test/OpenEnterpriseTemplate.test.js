/* eslint-disable no-console */
/* global artifacts, assert, before, context, contract, it */

const { randomId } = require('@aragon/templates-shared/helpers/aragonId')
const truffleAssert = require('truffle-assertions')

const { APPS, APP_IDS } = require('../temp/helpers/apps')

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

const getReceipts = (receipt, event, arg) => {
  const results = receipt.logs.filter(l => l.event === event)
  return arg ? results.map(e => e.args[arg]) : results
}

const getTokenManagers = receipt => {
  const tokenManagerAppId = namehash('token-manager.hatch.aragonpm.eth')
  return receipt.logs
    .filter(e => e.event === 'InstalledApp' && e.args.appId === tokenManagerAppId)
    .map(e => e.args.appProxy)
}

const getTokenFromTokenManager = async tokenManagerAddr => {
  const tokenManager =  getContract('TokenManager').at(tokenManagerAddr)
  const tokenAddr = await tokenManager.token()
  const token = getContract('MiniMeToken').at(tokenAddr)
  return token
}

/** Helper path functions to allow executing the script from relative or root location */
const parentDir = () => {
  const pwd = process.cwd().split('/')
  return pwd[pwd.length - 2]
}

const bountiesPath = `${
  process.env.SOLIDITY_COVERAGE
    ? '../../../'
    : parentDir() === 'templates'
      ? '../../'
      : ''
}shared/integrations/StandardBounties`


const ONE_DAY = 60 * 60 * 24
const ONE_WEEK = ONE_DAY * 7
const THIRTY_DAYS = ONE_DAY * 30

contract('OpenEnterpriseTemplate', ([ owner, member1, member2, member3 ]) => {
  const TOKEN1_NAME = 'DaoToken1'
  const TOKEN1_SYMBOL = 'DT1'
  const TOKEN2_NAME = 'DaoToken2'
  const TOKEN2_SYMBOL = 'DT2'
  const VOTING_BOOLS = [ false, false ]
  const TOKEN_TRANSFERABLE = false
  const TOKENS_LIMIT = true
  const TOKEN_HOLDERS = [ member1, member2, member3 ]
  const TOKEN_STAKES = [ 100, 200, 500 ]
  const TOKEN_BOOLS = [ TOKENS_LIMIT, TOKEN_TRANSFERABLE, TOKENS_LIMIT, TOKEN_TRANSFERABLE ]

  const VOTE_DURATION = ONE_WEEK
  const SUPPORT_REQUIRED = 50e16
  const MIN_ACCEPTANCE_QUORUM = 20e16
  const A1_VOTING_SETTINGS = [ SUPPORT_REQUIRED, MIN_ACCEPTANCE_QUORUM, VOTE_DURATION ]
  const DOT_VOTING_SETTINGS = [ SUPPORT_REQUIRED, MIN_ACCEPTANCE_QUORUM, VOTE_DURATION ]
  const VOTING_SETTINGS = [ ...DOT_VOTING_SETTINGS, ...A1_VOTING_SETTINGS ]
  const FINANCE_PERIOD = THIRTY_DAYS

  let template

  before('deploy required contract dependencies', async () => {
    // TODO: Make verbosity optional
    const bountiesAddress =
      (await exec(
        `cd ${bountiesPath} && npm run migrate${
          process.env.SOLIDITY_COVERAGE ? ':coverage' : ''
        } | tail -n 1`
      )).stdout.trim()
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
    // TODO: Configure AragonID
    // await ens.setOwner(node, aragonID.address)
    await ens.setSubnodeOwner(tld, label, aragonID.address)
    // await aragonID.register('0x'+keccak256('owner'), owner)

    // Deploy APM
    const tldName = 'eth'
    const labelName = 'aragonpm'
    const tldHash = namehash(tldName)
    const labelHash = '0x'+keccak256(labelName)
    // Deploy Hatch
    const hatchTldName = 'aragonpm.eth'
    const hatchTldHash = namehash(hatchTldName)
    const hatchLabelName = 'hatch'
    const hatchLabelHash = '0x'+keccak256(hatchLabelName)
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
    // Create subdomains and assigning it to APMRegistryFactory
    // assign `aragonpm.eth` to ourselves first so we can assign `hatch.aragonpm.eth`
    // This is a workaround to setting up a dao around the `aragonpm.eth` namespace
    await ens.setSubnodeOwner(tldHash, labelHash, owner)
    // assign `hatch.aragonpm.eth` to apmFactory
    await ens.setSubnodeOwner(hatchTldHash, hatchLabelHash, apmFactory.address)
    // transfer `aragonpm.eth` to apmFactory
    await ens.setSubnodeOwner(tldHash, labelHash, apmFactory.address)
    // TODO: Transferring name ownership from deployer to APMRegistryFactory
    const apmReceipt = await apmFactory.newAPM(tldHash, labelHash, owner)
    const hatchApmReceipt = await apmFactory.newAPM(hatchTldHash, hatchLabelHash, owner)
    const apm = getContract('APMRegistry').at(getReceipt(apmReceipt, 'DeployAPM', 'apm'))
    console.log('       Deployed APM at', apm.address)
    const hatchApm = getContract('APMRegistry').at(getReceipt(hatchApmReceipt, 'DeployAPM', 'apm'))
    console.log('       Deployed Hatch APM at', hatchApm.address)

    // Register apps
    for (const { name, contractName } of APPS) {
      const appBase = await getContract(contractName).new()
      console.log(`       Registering package for ${appBase.constructor.contractName} as "${name}.aragonpm.eth"`)
      if (name.includes('hatch')) {
        await hatchApm.newRepoWithVersion(name.replace('.hatch',''), owner, [ 1, 0, 0 ], appBase.address, '')
      } else {
        await apm.newRepoWithVersion(name, owner, [ 1, 0, 0 ], appBase.address, '')
      }
    }


    // Deploy OpenEnterpriseTemplate
    const baseContracts = [ daoFactBase.address, ens.address, miniMeFactoryBase.address, aragonID.address, bountiesAddress ]
    template = await getContract('OpenEnterpriseTemplate').new(baseContracts)
    console.log('       Deployed OpenEnterpriseTemplate at', template.address)
    console.log('\n       ===== Deployments completed =====\n\n')
  })

  context('dao instantiation', () => {
    context('when using agent as vault', () => {
      const USE_AGENT_AS_VAULT = true
      it('should run newTokensAndInstance without error', async () => {
        await template.newTokensAndInstance(
          randomId(),
          TOKEN1_NAME,
          TOKEN1_SYMBOL,
          TOKEN2_NAME,
          TOKEN2_SYMBOL,
          VOTING_SETTINGS,
          VOTING_BOOLS,
          USE_AGENT_AS_VAULT
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
    })

    context('when using just vault', () => {
      const USE_AGENT_AS_VAULT = false
      let installedOracle
      it('should run newTokensAndInstance without error', async () => {
        await template.newTokensAndInstance(
          randomId(),
          TOKEN1_NAME,
          TOKEN1_SYMBOL,
          TOKEN2_NAME,
          TOKEN2_SYMBOL,
          VOTING_SETTINGS,
          VOTING_BOOLS,
          USE_AGENT_AS_VAULT
        )
      })

      it('should run newTokenManagers without error', async () => {
        const result = await template.newTokenManagers(
          TOKEN_HOLDERS,
          TOKEN_STAKES,
          TOKEN_HOLDERS,
          TOKEN_STAKES,
          TOKEN_BOOLS
        )
        installedOracle = getReceipts(result, 'InstalledApp')
          .reduce((appAddress, l) => {
            return l.args.appId === APP_IDS['whitelist-oracle.hatch'] ?
              l.args.appProxy : appAddress
          }, null)
      })

      it('should run finalizeDao without error', async () => {
        await template.finalizeDao(
          [ FINANCE_PERIOD, FINANCE_PERIOD ],
          false
        )
      })

      it('should have initialized Oracle', async () => {
        await truffleAssert.reverts(
          getContract('WhitelistOracle')
            .at(installedOracle)
            .initialize([]),
          'INIT_ALREADY_INITIALIZED'
        )
      })
    })

    context('special cases', () => {
      let installReceipt

      before('reproduce 2 non-transferable tokens scenario', async () => {
        /* Create DAO to reproduce */
        await template.newTokensAndInstance(
          randomId(),
          TOKEN1_NAME,
          TOKEN1_SYMBOL,
          TOKEN2_NAME,
          TOKEN2_SYMBOL,
          VOTING_SETTINGS,
          VOTING_BOOLS,
          false // use agent as vault ?
        )

        installReceipt = await template.newTokenManagers(
          [owner],  // first token holders
          [200],    // first token holders stakes
          [owner],  // second token holders
          [200],    // second token holders stakes
          [ false, false, false, false ] // [Token1Limit, Token1Transferable, Token2Limit, Token2Transferable]
        )

        await template.finalizeDao(
          [ FINANCE_PERIOD, FINANCE_PERIOD ],
          false
        )
      })

      it('should not allow token-transfers', async () => {
        // get TokenManager apps and their  tokens
        const [ firstTokenManager, secondTokenManager ] = getTokenManagers(installReceipt)
        const firstToken = await getTokenFromTokenManager(firstTokenManager)
        const secondToken = await getTokenFromTokenManager(secondTokenManager)
        console.log('              Tokens found:', await firstToken.name(), await secondToken.name())

        // assert non-transferability of both tokens
        await truffleAssert.reverts(
          firstToken.transfer(member1, 100, { from: owner }),
          '', // there is no reason for in the contract require
          'first token should be non-transferable'
        )
        await truffleAssert.reverts(
          secondToken.transfer(member1, 100, { from: owner }),
          '',
          'second token should be non-transferable'
        )
      })
    })
  })
})
