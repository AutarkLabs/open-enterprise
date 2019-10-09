const { randomId } = require('@aragon/templates-shared/helpers/aragonId')

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
    token,
    useDiscussions,
    votingSettings,
  } = settings

  const { getEventArgument } = require('@aragon/test-helpers/events')
  const { getTemplateAddress } = require('../lib/ens')(web3, artifacts)
  const OpenEnterpriseTemplate = artifacts.require('OpenEnterpriseTemplate')
  const Kernel = artifacts.require('Kernel')

  try {
    const template = OpenEnterpriseTemplate.at(await getTemplateAddress())
    /*const template = OpenEnterpriseTemplate.at(
      '0x67e4e0d558c55b2becb26df8dd84d88d193f4d85'
    )*/
    console.log('template found at:', template.address)

    const daoID = randomId()

    console.log('daoId:', daoID)

    const baseDAO = await template.newTokenAndInstance(
      token.name,
      token.symbol,
      daoID,
      members,
      stakes,
      votingSettings,
      0,
      { from: members[0] }
    )

    //console.log(baseDAO)
    const dao = Kernel.at(getEventArgument(baseDAO, 'DeployDao', 'dao'))
    console.log('DAO: ',dao.address)

    const baseOpenEnterprise = await template.newOpenEnterprise(
      dotVotingSettings,
      0,
      false,
      { from: members[0] }
    )

    console.log(
      'created new dao with total cost',
      baseDAO.receipt.gasUsed + baseOpenEnterprise.receipt.gasUsed,
      'gas'
    )
    callback()
  } catch (e) {
    callback(e)
  }
}
