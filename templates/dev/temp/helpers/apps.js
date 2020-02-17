const { hash: namehash } = require('eth-ens-namehash')

const ARAGON_APPS = [
  { name: 'agent', contractName: 'Agent' },
  { name: 'vault', contractName: 'Vault' },
  { name: 'voting', contractName: 'Voting' },
  //   { name: 'survey', contractName: 'Survey' },
  //   { name: 'payroll', contractName: 'Payroll' },
  { name: 'finance', contractName: 'Finance' },
  { name: 'token-manager', contractName: 'TokenManager' },
  //{ name: 'whitelist-oracle', contractName: 'WhitelistOracle' },
  // { name: 'token-manager.hatch', contractName: 'TokenManager' },
  // { name: 'whitelist-oracle.hatch', contractName: 'WhitelistOracle' },
]
  
const ARAGON_APP_IDS = ARAGON_APPS.reduce((ids, { name }) => {
  ids[name] = namehash(`${name}.aragonpm.eth`)
  return ids
}, {})

const OE_APPS = [
  { name: 'address-book', contractName: 'AddressBook' },
  { name: 'allocations', contractName: 'Allocations' },
  { name: 'discussions', contractName: 'DiscussionApp' },
  { name: 'dot-voting', contractName: 'DotVoting' },
  { name: 'projects', contractName: 'Projects' },
  { name: 'rewards', contractName: 'Rewards' },
]

const OE_APP_IDS = OE_APPS.reduce((ids, { name }) => {
  ids[name] = namehash(`${name}.aragonpm.eth`)
  return ids
}, {})

module.exports = {
  APPS: [ ...ARAGON_APPS, ...OE_APPS ],
  APP_IDS: { ...ARAGON_APP_IDS, ...OE_APP_IDS }
}
