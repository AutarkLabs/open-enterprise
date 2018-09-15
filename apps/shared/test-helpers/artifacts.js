module.exports = {
  ACL: artifacts.require("./acl/ACL"),
  DAOFactory: artifacts.require("./contracts/factory/DAOFactory"),
  EVMScriptRegistryFactory: artifacts.require(
    "./contracts/factory/EVMScriptRegistryFactory"
  ),
  Kernel: artifacts.require("./kernel/Kernel"),
  getContract: name => artifacts.require(name)
};
