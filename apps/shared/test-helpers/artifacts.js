module.exports = {
  ACL: artifacts.require('./contracts/acl/ACL'),
  DAOFactory: artifacts.require('./factory/DAOFactory'),
  EVMScriptRegistryFactory: artifacts.require(
    './contracts/factory/EVMScriptRegistryFactory'
  ),
  Kernel: artifacts.require('./contracts/kernel/Kernel'),
  MiniMeToken: artifacts.require('./contracts/lib/minime/MiniMeToken'),
  StandardBounties: artifacts.require('./contracts/lib/bounties/StandardBounties'),
  getContract: name => artifacts.require(name)
}
