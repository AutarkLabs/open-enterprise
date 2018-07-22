var PlanningApp = artifacts.require("./misc/PlanningApp.sol");

module.exports = function(deployer) {
  deployer.deploy(PlanningApp);
};
