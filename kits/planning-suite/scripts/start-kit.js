const PlanningSuite = artifacts.require('PlanningSuite')
const pct16 = x =>
  new web3.BigNumber(x).times(new web3.BigNumber(10).toPower(16))
const getEventResult = (receipt, event, param) =>
  receipt.logs.filter(l => l.event == event)[0].args[param]

// ensure alphabetic order
const defaultOwner =
  process.env.OWNER || '0xD11225188CacD25989F4007eb88b81D40093d222'
const defaultPlanningSuiteAddr = process.env.PLANNING_SUITE_KIT || '0x7c7d384d147a03cce8ddf47d520f3f1c5e25a59f'

module.exports = async (
  truffleExecCallback,
  {
    owner = defaultOwner,
    planningSuiteAddr = defaultPlanningSuiteAddr,
  } = {}
) => {
    console.log('Starting Planning Suite Kit... 🚀')

    let daoAddress, tokenAddress
    let vaultAddress, votingAddress
  
    console.log('setting up support values')
    const neededSupport = pct16(50)
    const minimumAcceptanceQuorum = pct16(20)
    const minParticipationPct = pct16(50)
    const candidateSupportPct = pct16(10)
    const votingTime = 60
    console.log('Creating kit instance at ', planningSuiteAddr)

    kit = await PlanningSuite.at(planningSuiteAddr)
    console.log('kit instance created')
    aragonId = 'planning-suite-dao-' + Math.floor(Math.random() * 1000)
    tokenName = 'AutarkToken1'
    tokenSymbol = 'autark1'

    const holders = [owner]
    const stakes = [200e18]

    // create Token
    console.log('Creating token')
    const receiptToken = await kit.newToken(tokenName, tokenSymbol)
    console.log('got here')
    // console.log(accounts)
    tokenAddress = getEventResult(receiptToken, 'DeployToken', 'token')

    console.log('Creating instance:', {
    aragonId,
    holders,
    stakes,
    candidateSupportPct,
    minimumAcceptanceQuorum,
    votingTime,
    owner
    })

    // create Instance
    receiptInstance = await kit.newInstance(
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
    console.log('Dao Created', daoAddress)
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
}

