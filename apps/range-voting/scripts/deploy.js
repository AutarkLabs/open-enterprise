module.exports = async callback => {
  const c = await artifacts.require(require('../arapp').path).new()
  console.info('[Range Voting > deploy.js] Deployed:', c.address)
  callback()
}
