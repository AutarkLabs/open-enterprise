const { hash: namehash } = require('eth-ens-namehash')

const ARAGON_APPS = [
  { name: 'agent', contractName: 'Agent' },
  { name: 'vault', contractName: 'Vault' },
  { name: 'voting', contractName: 'Voting' },
  //   { name: 'survey', contractName: 'Survey' },
  //   { name: 'payroll', contractName: 'Payroll' },
  { name: 'finance', contractName: 'Finance' },
  //{ name: 'token-manager-custom', contractName: 'TokenManager' },
  //{ name: 'whitelist-oracle', contractName: 'WhitelistOracle' },
  { name: 'token-manager.hatch', contractName: 'TokenManager' },
  { name: 'whitelist-oracle.hatch', contractName: 'WhitelistOracle' },
]
  
const ARAGON_APP_IDS = ARAGON_APPS.reduce((ids, { name }) => {
  ids[name] = namehash(`${name}.aragonpm.eth`)
  return ids
}, {})

const OE_APPS = [
  { name: 'about.hatch', contractName: 'About' },
  { name: 'address-book-experimental.open', contractName: 'AddressBook' },
  { name: 'allocations-experimental.open', contractName: 'Allocations' },
  { name: 'discussions-experimental.open', contractName: 'DiscussionApp' },
  { name: 'dot-voting-experimental.open', contractName: 'DotVoting' },
  { name: 'projects-experimental.open', contractName: 'Projects' },
  { name: 'rewards-experimental.open', contractName: 'Rewards' },
]

const OE_APP_IDS = OE_APPS.reduce((ids, { name }) => {
  ids[name] = namehash(`${name}.aragonpm.eth`)
  return ids
}, {})

module.exports = {
  APPS: [ ...ARAGON_APPS, ...OE_APPS ],
  APP_IDS: { ...ARAGON_APP_IDS, ...OE_APP_IDS }
}
