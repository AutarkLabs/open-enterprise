require('dotenv').config({ path: '../.env' })
const path = require('path')
const fs = require('fs')

const namehash = require('eth-ens-namehash').hash

const deployDAOFactory = require('@aragon/os/scripts/deploy-daofactory.js')
const logDeploy = require('@aragon/os/scripts/helpers/deploy-logger')

// ensure alphabetic order
const apps = ['finance', 'token-manager', 'vault', 'voting']
const appIds = apps.map(app => namehash(`${app}.aragonpm.eth`))

const planningApps = [
  'address-book',
  'allocations',
  'dot-voting',
  'projects',
  'rewards',
]
const planningAppIds = planningApps.map(app =>
  namehash(`tps-${app}.open.aragonpm.eth`)
)

const globalArtifacts = this.artifacts // Not injected unless called directly via truffle
const defaultOwner =
  process.env.OWNER || '0x8d1EEa0Ae8BB40B192F6671293D08888450D9580'
const defaultENSAddress =
  process.env.ENS || '0x98Df287B6C145399Aaa709692c8D308357bC085D'
const defaultDAOFactoryAddress = process.env.DAO_FACTORY
const defaultMinimeTokenFactoryAddress = process.env.MINIME_TOKEN_FACTORY
const defaultRegistryAddress = process.env.STANDARD_BOUNTIES_REGISTRY

module.exports = async (
  truffleExecCallback,
  {
    artifacts = globalArtifacts,
    owner = defaultOwner,
    ensAddress = defaultENSAddress,
    daoFactoryAddress = defaultDAOFactoryAddress,
    minimeTokenFactoryAddress = defaultMinimeTokenFactoryAddress,
    registryAddress = defaultRegistryAddress,
    kitName,
    kitContractName = kitName,
    network,
    verbose = true,
    flattenContracts = false,
    returnKit = false,
  } = {}
) => {
  const log = (...args) => {
    if (verbose) {
      console.log(...args)
    }
  }

  log(
    `${kitName} in ${network} network with ENS ${ensAddress} and owner ${owner}`
  )

  const kitEnsName = kitName + '.open.aragonpm.eth'

  const MiniMeTokenFactory = artifacts.require('MiniMeTokenFactory')
  const DAOFactory = artifacts.require('DAOFactory')
  const ENS = artifacts.require('ENS')
  const StandardBounties = artifacts.require('StandardBounties')

  const newRepo = async (apm, name, acc, contract) => {
    log(`Creating Repo for ${contract}`)
    const c = await artifacts.require(contract).new()
    return await apm.newRepoWithVersion(
      name,
      acc,
      [1, 0, 0],
      c.address,
      '0x1245'
    )
  }

  let arappFileName
  if (!returnKit) {
    if (network !== 'rpc' && network !== 'devnet') {
      arappFileName = 'arapp.json'
    } else {
      arappFileName = 'arapp_local.json'
    }
    if (!ensAddress) {
      const betaArapp = require('../' + arappFileName)
      ensAddress = betaArapp.environments[network].registry
    }
  }

  console.log('arappFileName', arappFileName)

  if (!ensAddress) {
    errorOut('ENS environment variable not passed, aborting.')
  }
  log('Using ENS', ensAddress)
  const ens = ENS.at(ensAddress)

  let daoFactory
  if (daoFactoryAddress) {
    log(`Using provided DAOFactory: ${daoFactoryAddress}`)
    daoFactory = DAOFactory.at(daoFactoryAddress)
  } else {
    daoFactory = (await deployDAOFactory(null, { artifacts, verbose: true }))
      .daoFactory
  }

  let minimeFac
  if (minimeTokenFactoryAddress) {
    log(`Using provided MiniMeTokenFactory: ${minimeTokenFactoryAddress}`)
    minimeFac = MiniMeTokenFactory.at(minimeTokenFactoryAddress)
  } else {
    minimeFac = await MiniMeTokenFactory.new()
    log('Deployed MiniMeTokenFactory:', minimeFac.address)
  }

  const aragonid = await ens.owner(namehash('aragonid.eth'))

  let registry
  if (registryAddress) {
    log(`Using provided StandardBounties: ${registryAddress}`)
    registry = StandardBounties.at(registryAddress)
  } else {
    registry = await StandardBounties.new(owner)
    log('Deployed StandardBounties:', registry.address)
  }

  const kitContract = artifacts.require(kitContractName)
  let kit
  try {
    kit = await kitContract.new(
      daoFactory.address,
      ens.address,
      minimeFac.address,
      aragonid,
      appIds,
      planningAppIds,
      registry.address
    )
  } catch (err) {
    log('error with kit', err)
  }

  log('Deployed Planning Suite Kit:', kit.address, planningAppIds)

  await logDeploy(kit, { verbose, flattenContracts })

  if (returnKit) {
    return kit
  }

  if (network === 'devnet' || network === 'rpc') {
    // Useful for testing to avoid manual deploys with aragon-dev-cli
    log('Creating APM package with owner', owner)
    const apmAddr = await artifacts
      .require('PublicResolver')
      .at(await ens.resolver(namehash('aragonpm.eth')))
      .addr(namehash('aragonpm.eth'))
    const apm = artifacts.require('APMRegistry').at(apmAddr)
    log('Created APM at', apmAddr)

    if (
      (await ens.owner(appIds[0])) ==
      '0x0000000000000000000000000000000000000000'
    ) {
      log('Deploying apps in local network')
      await newRepo(apm, 'voting', owner, 'Voting')
      await newRepo(apm, 'finance', owner, 'Finance')
      await newRepo(apm, 'token-manager', owner, 'TokenManager')
      await newRepo(apm, 'vault', owner, 'Vault')
    }

    if (
      (await ens.owner(planningAppIds[0])) ==
      '0x0000000000000000000000000000000000000000'
    ) {
      log('Deploying Planning apps in local network')
      await newRepo(apm, 'address-book', owner, 'AddressBook')
      await newRepo(apm, 'allocations', owner, 'Allocations')
      await newRepo(apm, 'dot-voting', owner, 'DotVoting')
      await newRepo(apm, 'projects', owner, 'Projects')
      await newRepo(apm, 'rewards', owner, 'Rewards')
    }

    if (
      (await ens.owner(namehash(kitEnsName))) ==
      '0x0000000000000000000000000000000000000000'
    ) {
      log(`creating APM package for ${kitName} at ${kit.address}`)
      await apm.newRepoWithVersion(
        kitName,
        owner,
        [1, 0, 0],
        kit.address,
        'ipfs:'
      )
    } else {
      // TODO: update APM Repo?
      log(`using deployed APM package for ${kitName} at ${kit.address}`)
    }
  }

  const kitArappPath = path.resolve('.') + '/' + arappFileName
  let arappObj = {}
  if (fs.existsSync(kitArappPath)) arappObj = require(kitArappPath)
  if (arappObj.environments === undefined) arappObj.environments = {}
  if (arappObj.environments[network] === undefined)
    arappObj.environments[network] = {}
  arappObj.environments[network].registry = ens.address
  arappObj.environments[network].appName = kitEnsName
  arappObj.environments[network].address = kit.address
  arappObj.environments[network].network = network
  if (arappObj.path === undefined)
    arappObj.path = 'contracts/' + kitContractName + '.sol'
  const arappFile = JSON.stringify(arappObj, null, 2)
  // could also use https://github.com/yeoman/stringify-object if you wanted single quotes
  fs.writeFileSync(kitArappPath, arappFile)
  log(`Kit addresses saved to ${arappFileName}`)

  if (typeof truffleExecCallback === 'function') {
    // Called directly via `truffle exec`
    truffleExecCallback()
  } else {
    return arappObj
  }
}
