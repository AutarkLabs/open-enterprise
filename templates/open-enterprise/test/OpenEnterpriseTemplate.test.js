/* global artifacts, assert, before, context, contract, describe, it, web3 */
const { getTemplateAddress } = require('../temp/lib/ens')(web3, artifacts)
const { randomId } = require('@aragon/templates-shared/helpers/aragonId')

/** Helper function to import truffle contract artifacts */
const getContract = name => artifacts.require(name)

const ONE_DAY = 60 * 60 * 24
const ONE_WEEK = ONE_DAY * 7
const THIRTY_DAYS = ONE_DAY * 30

contract('OpenEnterpriseTemplate', ([ owner, member1, member2, member3 ]) => {
  const DAO_ID = randomId()
  const TOKEN_NAME = 'DaoToken'
  const TOKEN_SYMBOL = 'DT'
  const TOKEN_TRANSFERABLE = false
  const TOKEN_HOLDERS = [ member1, member2, member3 ]
  const TOKEN_STAKES = [ 100, 200, 500 ]

  const VOTE_DURATION = ONE_WEEK
  const SUPPORT_REQUIRED = 50e16
  const MIN_ACCEPTANCE_QUORUM = 20e16
  const VOTING_SETTINGS = [ SUPPORT_REQUIRED, MIN_ACCEPTANCE_QUORUM, VOTE_DURATION ]
  const FINANCE_PERIOD = THIRTY_DAYS

  let template

  before('fetch open enterprise template', async () => {
    template = getContract('OpenEnterpriseTemplate').at(await getTemplateAddress())
  })

  context('newTokenAndInstance', () => {
    it('should run without error', async () => {
      // TODO: sort params in the contract
      await template.newTokenAndInstance(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        DAO_ID,
        TOKEN_HOLDERS,
        TOKEN_STAKES,
        VOTING_SETTINGS,
        FINANCE_PERIOD,
        TOKEN_TRANSFERABLE,
      )

    })

    it('should cost below gas limit', () => {

    })

  })
})