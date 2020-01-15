
const { hash: namehash } = require('eth-ens-namehash')

module.exports = async function getId(artifacts) {
  const ENS = artifacts.require('ENS')
  const ensAddress = '0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1'
  const ens = ENS.at(ensAddress)

  let id = 0
  while (await isDaoRegistered(ens, id)) {
    id++
  }
  return `dao-${id}`
}

async function isDaoRegistered(ens, id) {
  const daoNameHash = namehash(`dev-dao-${id}.aragonid.eth`)
  const owner = await ens.owner(daoNameHash)
  return owner !== '0x0000000000000000000000000000000000000000' && owner !== '0x'
}
