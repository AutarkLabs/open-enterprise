module.exports = {
  ACL: artifacts.require("./acl/ACL"),
  DAOFactory: artifacts.require("./factory/DAOFactory"),
  EVMScriptRegistryFactory: artifacts.require(
    "./factory/EVMScriptRegistryFactory"
  ),
  Kernel: artifacts.require("./kernel/Kernel"),
  MiniMeToken: artifacts.require("./lib/minime/MiniMeToken"),
  getContract: name => artifacts.require(name)
};
