const PlanningSuite = artifacts.require('PlanningSuite')
const pct16 = x =>
  new web3.BigNumber(x).times(new web3.BigNumber(10).toPower(16))
const getEventResult = (receipt, event, param) =>
  receipt.logs.filter(l => l.event == event)[0].args[param]

// ensure alphabetic order
const defaultOwner =
  process.env.OWNER || '0x8d1EEa0Ae8BB40B192F6671293D08888450D9580'
const defaultPlanningSuiteAddr =
  process.env.PLANNING_SUITE_KIT || '0x3dbe3e16364fae0a65b203550a9d1619c6c965cf'

module.exports = async (
  truffleExecCallback,
  { owner = defaultOwner, planningSuiteAddr = defaultPlanningSuiteAddr } = {}
) => {
  console.log('Starting Planning Suite Kit... 🚀')

  let daoAddress, tokenAddress
  let vaultAddress, votingAddress

  console.log('Setting up parameters')
  const neededSupport = pct16(50)
  const minimumAcceptanceQuorum = pct16(20)
  const minParticipationPct = pct16(50)
  const candidateSupportPct = 0
  const votingTime = 900
  const holders = [owner]
  const stakes = [200e18]
  aragonId = 'test-tps-dao-' + Math.floor(Math.random() * 1000)
  tokenName = 'Test Token'
  tokenSymbol = 'test'
  // aragonId = 'planning-suite-dao-' + Math.floor(Math.random() * 1000)
  // tokenName = 'AutarkToken1'
  // tokenSymbol = 'autark1'

  
  console.log('Creating kit instance at ', planningSuiteAddr)
  kit = await PlanningSuite.at(planningSuiteAddr)
  console.log('kit instance created')


  console.log('Creating token and instance:', {
    tokenName,
    tokenSymbol,
    aragonId,
    holders,
    stakes,
    candidateSupportPct,
    minimumAcceptanceQuorum,
    votingTime,
    owner,
  })

  // create Instance
  receiptInstance = await kit.newTokenAndInstance(
    tokenName,
    tokenSymbol,
    aragonId,
    holders,
    stakes,
    neededSupport,
    minimumAcceptanceQuorum,
    votingTime
  )
  
  // generated apps from dao creation
  daoAddress = getEventResult(receiptInstance, 'DeployInstance', 'dao')
  vaultAddress = getEventResult(receiptInstance, 'DeployInstance', 'vault')
  votingAddress = getEventResult(receiptInstance, 'DeployInstance', 'voting')
  tokenAddress = getEventResult(receiptInstance, 'DeployInstance', 'token')
  console.log('DAO Created:', daoAddress)
  console.log('Vault Address:', vaultAddress)
  console.log('Token Address:', tokenAddress)
  console.log('Aragon Core apps added...')
  
  // Add PlanningSuite Apps to DAO
  receiptInstance = await kit.newPlanningApps(
    daoAddress,
    vaultAddress,
    votingAddress,
    tokenAddress,
    candidateSupportPct,
    minParticipationPct,
    votingTime
  )
  console.log('Planning Suite apps added...')
  console.log('Finished!')
  console.log('Visit your DAO at https://rinkeby.aragon.org/#/' + aragonId + '.aragonid.eth')
}
