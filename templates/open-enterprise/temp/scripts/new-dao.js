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

  const { getTemplateAddress } = require('../lib/ens')(web3, artifacts)
  const OpenEnterpriseTemplate = artifacts.require('OpenEnterpriseTemplate')

  try {
    // const template = OpenEnterpriseTemplate.at(await getTemplateAddress())
    const template = OpenEnterpriseTemplate.at(
      '0xee514cde999a30047d57c329f874f64b8a98ff46'
    )
    console.log('template found at:', template.address)

    // const tokenBase = await template.newToken(token.name, token.symbol)
    // console.log('new token receipt', tokenBase.receipt)

    const MEMBERS = members
    const STAKES = stakes
    const ONE_DAY = 60 * 60 * 24
    const ONE_WEEK = ONE_DAY * 7
    const THIRTY_DAYS = ONE_DAY * 30
    const TOKEN_NAME = 'Autark Token'
    const TOKEN_SYMBOL = 'AUT'
    const VOTE_DURATION = ONE_WEEK
    const SUPPORT_REQUIRED = 50e16
    const MIN_ACCEPTANCE_QUORUM = 20e16
    const VOTING_SETTINGS = [
      SUPPORT_REQUIRED,
      MIN_ACCEPTANCE_QUORUM,
      VOTE_DURATION,
    ]
    const DOT_VOTING_SETTINGS = [
      MIN_ACCEPTANCE_QUORUM,
      SUPPORT_REQUIRED,
      VOTE_DURATION,
    ]
    //   const DOT_VOTING_SETTINGS = [ SUPPORT_REQUIRED, MIN_ACCEPTANCE_QUORUM, VOTE_DURATION ]

    const daoID = randomId()

    console.log('daoId:', daoID)

    const baseDAO = await template.newTokenAndInstance(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      daoID,
      MEMBERS,
      STAKES,
      VOTING_SETTINGS,
      0,
      { from: members[0] }
    )

    console.log('test')

    const baseOpenEnterprise = await template.newOpenEnterprise(
      DOT_VOTING_SETTINGS,
      0,
      false
    )

    // const baseDAO = await template.newTokenAndInstance(
    //   token.name,
    //   token.symbol,
    //   id,
    //   members,
    //   votingSettings,
    //   financePeriod,
    //   { from: members[0] }
    // )

    // const baseOpenEnterprise = await template.newOpenEnterprise(
    //   dotVotingSettings,
    //   allocationsPeriod,
    //   useDiscussions
    // )
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
