module.exports = async function newDao({
  artifacts,
  callback,
  settings,
  web3,
}) {
  const {
    allocationsPeriod,
    dotVotingSettings,
    financePeriod,
    id,
    members,
    stakes,
    token1,
    token2,
    useDiscussions,
    votingSettings,
    votingBools,
    useAgentAsVault,
  } = settings
  console.log('settings:', settings)
  const { getEventArgument } = require('@aragon/test-helpers/events')
  const { getTemplateAddress } = require('../lib/ens')(web3, artifacts)
  const OpenEnterpriseTemplate = artifacts.require('OpenEnterpriseTemplate')
  const Kernel = artifacts.require('Kernel')
  
  try {
    const template = OpenEnterpriseTemplate.at(await getTemplateAddress())
  
    const baseDAO = await template.newTokensAndInstance(
      id,
      token1.name,
      token1.symbol,
      token2.name,
      token2.symbol,
      [ ...dotVotingSettings, ...votingSettings ],
      votingBools,
      useAgentAsVault,
      { from: members[0] }
    )
    
    const dao = Kernel.at(getEventArgument(baseDAO, 'DeployDao', 'dao'))
    

    const baseDaoWithTokenMgrs = await template.newTokenManagers(
      members,
      stakes,
      members,
      stakes,
      [ false, true, false, false ],
      { from: members[0] }
    )

    const baseOpenEnterprise = await template.finalizeDao(
      [ 0, 0 ],
      useDiscussions,
      { from: members[0] }
    )

    console.log('🤓 Template found at:', template.address)
    console.log(
      '🚀 Created new dao at address:',
      dao.address,
      '\n⛽️ Total gas cost for creation:',
      baseDAO.receipt.gasUsed + baseDaoWithTokenMgrs.receipt.gasUsed + baseOpenEnterprise.receipt.gasUsed, 'gas',
      '\n🌐 You can access it at:',
      `http://localhost:8080/ipfs/QmVptozeYf3XxqHfvMjofCkZsYSqi6YuvHFLMc83SECbNw/#/${id}`
    )
    callback()
  } catch (e) {
    callback(e)
  }
}
