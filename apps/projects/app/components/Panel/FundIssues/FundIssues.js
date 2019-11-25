/* eslint-disable react/prop-types */
// issues are validated using correct shape - eslint problem?
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { addHours } from 'date-fns'
import BigNumber from 'bignumber.js'
import { useAragonApi } from '../../../api-react'
import useGithubAuth from '../../../hooks/useGithubAuth'
import { usePanelManagement } from '..'
import { computeIpfsString } from '../../../utils/ipfs-helpers'
import { toHex } from 'web3-utils'
import { IconClose } from '@aragon/ui'
import NoFunds from '../../../assets/noFunds.svg'
import {
  Text,
  TextInput,
  DropDown,
  useTheme,
  GU,
  Button,
  Info,
} from '@aragon/ui'

import { Form, FormField, DateInput } from '../../Form'
import { issueShape } from '../../../utils/shapes.js'
import EditBounty from './EditBounty'
import {
  AmountInput,
  HorizontalInputGroup,
  HoursInput,
  IssueTitleCompact,
  TokenInput,
} from './styled'

const ETHER_TOKEN_FAKE_ADDRESS = '0x0000000000000000000000000000000000000000'

const errorMessages = {
  amount: ({ sayAmount, plural }) =>
    (sayAmount ? `Funding amount${plural ? 's' : ''}` : 'Estimated hours') +
    ' must be greater than zero',
  date: () => 'The deadline cannot be in the past',
  total: ({ inVault, sayTotal, symbol, total }) =>
    `The ${sayTotal ? 'total' : ''} funding amount of ${total} ${symbol} ` +
    `exceeds the available funds in the vault (${inVault} ${symbol}).`
}

const bountiesFor = ({ bountySettings, issues, tokens }) => issues.reduce(
  (bounties, issue) => {
    bounties[issue.id] = {
      issueId: issue.id,
      repo: issue.repo,
      number: issue.number,
      repoId: issue.repoId,
      hours: issue.hours ? parseFloat(issue.hours) : '',
      exp: issue.exp || 0,
      deadline: issue.deadline
        ?  new Date(issue.deadline)
        : addHours(new Date(), bountySettings.bountyDeadline),
      slots: 1,
      slotsIndex: 0,
      payout: issue.payout || 0,
      token: tokens.find(t => t.symbol === issue.symbol) || tokens[0],
    }
    return bounties
  },
  {}
)

const BountyUpdate = ({
  issue,
  bounty,
  submitBounties,
  description,
  tokens,
  updateBounty,
}) => {
  const { appState: { bountySettings } } = useAragonApi()
  const [ submitDisabled, setSubmitDisabled ] = useState(false)
  const [ maxError, setMaxError ] = useState(false)
  const [ zeroError, setZeroError ] = useState(false)
  const [ dateError, setDateError ] = useState(false)

  const expLevels = bountySettings.expLvls

  useEffect(() => {
    const today = new Date()
    const maxErr = BigNumber(bounty.payout)
      .times(10 ** bounty.decimals)
      .gt(BigNumber(bounty.balance))
    const zeroErr = bounty.payout === 0
    const dateErr = today > bounty.deadline
    setMaxError(maxErr)
    setZeroError(zeroErr)
    setDateError(dateErr)
    setSubmitDisabled( maxErr || zeroErr || dateErr )
  }, [bounty])

  return (
    <>
      <Form
        css={`margin: ${2 * GU}px 0`}
        onSubmit={submitBounties}
        description={description}
        submitText="Submit"
        submitDisabled={submitDisabled}
      >
        <FormField
          input={
            <React.Fragment>
              <div css={`
                padding: ${2 * GU}px 0;
                display: flex;
              `}>
                <IssueTitleCompact
                  title={issue.title}
                  tag={bounty && bounty.hours > 0
                    ? BigNumber(bounty.payout).dp(2) + ' ' + bounty.symbol
                    : ''
                  }
                />
              </div>

              <UpdateRow>
                { bountySettings.fundingModel === 'Fixed' ? (
                  <FormField
                    label="Amount"
                    input={
                      <HorizontalInputGroup>
                        <AmountInput
                          name="amount"
                          value={bounty.payout}
                          onChange={e => updateBounty({ payout: e.target.value })}
                          wide
                        />
                        <TokenInput
                          name="token"
                          items={tokens.map(t => t.symbol)}
                          selected={tokens.indexOf(bounty.token)}
                          onChange={i => updateBounty({ token: tokens[i] })}
                        />
                      </HorizontalInputGroup>
                    }
                  />
                ) : (
                  <FormField
                    label="Estimated Hours"
                    input={
                      <HoursInput
                        width="100%"
                        name="hours"
                        value={bounty.hours}
                        onChange={e => updateBounty({
                          hours: e.target.value && parseFloat(e.target.value)
                        })}
                      />
                    }
                  />
                )}

                <FormField
                  label="Difficulty"
                  input={
                    <DropDown
                      items={expLevels.map(exp => exp.name)}
                      onChange={index => updateBounty({ exp: index })}
                      selected={bounty.exp}
                      wide
                    />
                  }
                />
              </UpdateRow>

              <div css={`
                width: 100%;
                margin-bottom: ${3 * GU}px;
              `}>
                <FormField
                  label="Deadline"
                  input={
                    <DateInput
                      name='deadline'
                      value={bounty.deadline}
                      onChange={deadline => updateBounty({ deadline })}
                      width="100%"
                    />
                  }
                />
              </div>
            </React.Fragment>
          }
        />
      </Form>
      {maxError && <ErrorMessage text={errorMessages.total()} />}
      {zeroError &&
        <ErrorMessage text={
          errorMessages.amount({
            sayAmount: bountySettings.fundingModel === 'Fixed',
            plural: false,
          })}
        />
      }
      {dateError && <ErrorMessage text={errorMessages.date()} />}
    </>
  )
}
BountyUpdate.propTypes = {
  issue: issueShape,
  bounty: PropTypes.object.isRequired,
  submitBounties: PropTypes.func.isRequired,
  description: PropTypes.string.isRequired,
  tokens: PropTypes.array.isRequired,
  updateBounty: PropTypes.func.isRequired,
}

const FundForm = ({
  issues,
  bounties,
  submitBounties,
  description,
  tokens,
  descriptionChange,
  updateBounty,
}) => {
  const { appState: { bountySettings } } = useAragonApi()
  const [ submitDisabled, setSubmitDisabled ] = useState(true)
  const [ maxErrors, setMaxErrors ] = useState([])
  const [ zeroError, setZeroError ] = useState([])
  const [ dateError, setDateError ] = useState([])
  const [ validate, setValidate ] = useState(false)

  useEffect(() => {
    setMaxErrors(tokens.reduce(
      (errors, token) => {
        const inVault = BigNumber(token.balance)
        const bountiesForToken = Object.values(bounties)
          .filter(b => b.token.symbol === token.symbol)
        const total = bountiesForToken.reduce(
          (sum, b) => sum.plus(BigNumber(b.payout || 0).times(10 ** token.decimals)),
          BigNumber(0)
        )
        if (total.gt(inVault)) {
          errors.push({
            inVault: inVault.div(10 ** token.decimals).dp(4).toString(),
            symbol: token.symbol,
            total: total.div(10 ** token.decimals).dp(4).toString(),
            sayTotal: bountiesForToken.length > 1,
          })
        }
        return errors
      },
      []
    ))
  }, [ tokens, bounties ])

  useEffect(() => {
    if (!validate) return
    const today = new Date()
    const zeroErrArray = []
    const dateErrArray = []
    Object.values(bounties).forEach(bounty => {
      if (!bounty.payout) zeroErrArray.push(bounty.issueId)
      if (today > bounty.deadline) dateErrArray.push(bounty.issueId)
    })
    setZeroError(zeroErrArray)
    setDateError(dateErrArray)
    setSubmitDisabled(
      description === '' ||
      !!maxErrors.length ||
      !!zeroErrArray.length ||
      !!dateErrArray.length
    )
  }, [ validate, bounties, description, maxErrors ])

  return (
    <>
      <Form
        css={`margin: ${2 * GU}px 0`}
        onSubmit={submitBounties}
        description={description}
        submitText={issues.length > 1 ? 'Fund Issues' : 'Fund Issue'}
        submitDisabled={submitDisabled}
      >
        <FormField
          label="Description"
          required
          input={
            <TextInput.Multiline
              rows="3"
              name="description"
              style={{ resize: 'none' }}
              onChange={descriptionChange}
              value={description}
              wide
            />
          }
        />
        <FormField
          label="Issues"
          hint="Enter the estimated hours per issue"
          required
          input={
            <React.Fragment>
              {issues.map(issue => (
                <EditBounty
                  key={issue.id}
                  issue={issue}
                  bounty={bounties[issue.id]}
                  tokens={tokens}
                  onBlur={() => setValidate(true)}
                  updateBounty={updateBounty(issue.id)}
                />
              ))}
            </React.Fragment>
          }
        />
      </Form>
      {maxErrors.map((maxError, i) => (
        <ErrorMessage key={i} text={errorMessages.total(maxError)} />
      ))}
      {!!zeroError.length &&
        <ErrorMessage text={
          errorMessages.amount({
            sayAmount: bountySettings.fundingModel === 'Fixed',
            plural: issues.length > 1,
          })}
        />
      }
      {!!dateError.length && <ErrorMessage text={errorMessages.date()} />}
    </>
  )
}

FundForm.propTypes = {
  issues: PropTypes.arrayOf(issueShape),
  bounties: PropTypes.object.isRequired,
  submitBounties: PropTypes.func.isRequired,
  description: PropTypes.string.isRequired,
  tokens: PropTypes.array.isRequired,
  descriptionChange: PropTypes.func.isRequired,
  updateBounty: PropTypes.func.isRequired,
}

const FundIssues = ({ issues, mode }) => {
  const githubCurrentUser = useGithubAuth()
  const { api, appState } = useAragonApi()
  const { bountySettings } = appState
  const { closePanel } = usePanelManagement()
  const [ description, setDescription ] = useState('')
  const tokens = useMemo(() => {
    if (bountySettings.fundingModel === 'Fixed') return appState.tokens
    return [appState.tokens.find(t => t.addr === bountySettings.bountyCurrency)]
  }, [bountySettings])
  const [ bounties, setBounties ] = useState(bountiesFor({ bountySettings, issues, tokens }))

  const fundsAvailable = useMemo(() => tokens.reduce(
    (sum, t) => sum.plus(BigNumber(t.balance)),
    BigNumber(0)
  ), [ bountySettings.fundingModel, tokens ])

  const descriptionChange = e => setDescription(e.target.value)

  const updateBounty = useCallback(issueId => update => {
    const newBounties = {
      ...bounties,
      [issueId]: {
        ...bounties[issueId],
        ...update,
      }
    }

    if (update.hours || update.exp) {
      const { exp, hours } = newBounties[issueId]
      const { baseRate, expLvls } = bountySettings
      newBounties[issueId].payout = hours * baseRate * expLvls[exp].mul
    }

    setBounties(newBounties)
  }, [ bounties, bountySettings ])

  const submitBounties = async (e) => {
    e.preventDefault()
    const today = new Date()
    const activity = {
      user: githubCurrentUser,
      date: today.toISOString(),
      description,
    }

    Object.keys(bounties).map(id => {
      // if it's an update, there is only one issue
      if (mode === 'update') {
        bounties[id]['fundingHistory'] = [ ...issues[0].fundingHistory, activity ]
      } else {
        bounties[id]['fundingHistory'] = [activity]
      }
    })

    closePanel()

    // computes an array of issues and denests the actual issue object for smart contract
    const issuesArray = []

    for (let key in issues) {
      issuesArray.push({
        key: key,
        exp: bounties[issues[key].id].exp,
        fundingHistory: bounties[issues[key].id].fundingHistory,
        deadline: bounties[issues[key].id].deadline,
        hours: bounties[issues[key].id].hours ? bounties[issues[key].id].hours : 0,
        payout: bounties[issues[key].id].payout,
        token: bounties[issues[key].id].token,
        ...issues[key],
      })
    }

    const ipfsAddresses = await computeIpfsString(issuesArray)
    const repoIds = issuesArray.map(issue => toHex(issue.repoId))
    const issueNumbers = issuesArray.map(issue => issue.number)
    let tokenContracts = []
    let bountySizes = []
    let tokenTypes = []
    for (let i = 0; i < issuesArray.length; i++) {
      const issue = issuesArray[i]
      tokenContracts.push(issue.token.addr)
      tokenTypes.push(issue.token.addr === ETHER_TOKEN_FAKE_ADDRESS ? 1 : 20)
      bountySizes.push(
        BigNumber(issue.payout).times(10 ** issue.token.decimals).toString()
      )
    }
    const deadlines = Object.keys(bounties).map(
      id => bounties[id]['deadline'].getTime()
    )

    // during development, sometimes this fails with a cryptic "cannot perform action" error
    // in case this happens in QA, let's leave this logging here to at least have some paper trail
    //console.log( // eslint-disable-line
    //  'ipfs file', issuesArray,
    //  'bounties', bounties,
    //  'repoIds', repoIds,
    //  'issueNumbers', issueNumbers,
    //  'bountySizes', bountySizes,
    //  'deadlines', deadlines,
    //  'tokenTypes', tokenTypes,
    //  'tokenContracts', tokenContracts,
    //  'ipfsAddresses', ipfsAddresses,
    //  'description', description
    //)

    api.addBounties(
      repoIds,
      issueNumbers,
      bountySizes,
      deadlines,
      tokenTypes,
      tokenContracts,
      ipfsAddresses,
      description
    ).subscribe(
      () => {
        // TODO: Temporarily disable commenting on github. Linting was also disabled at lines 480 and 488 for this, to make CI pass
        // A better workaround in the future would be refactor into an opt-in feature, maybe with a checkbox in Settings?
        // issuesArray.forEach(issue => {
        //   post({
        //     variables: {
        //       body:
        //         'This issue has a bounty attached to it.\n' +
        //         `Amount: ${issue.payout.toFixed(2)} ${issue.token.symbol}\n` +
        //         `Deadline: ${issue.deadline.toUTCString()}`,
        //       subjectId: issue.key,
        //     },
        //   })
        // })
      },
      err => console.error(`error: ${err}`)
    )
  }

  if (fundsAvailable.toString() === '0') {
    return (
      <InfoPanel
        imgSrc={NoFunds}
        title="No funds found."
        message="It seems that your organization has no funds available to fund issues. Navigate to the Finance app to deposit some funds first."
      />
    )
  }

  if (mode === 'update') {
    // in 'update' mode there is only one issue
    const issue = issues[0]
    const bounty = bounties[issues[0].id]
    return (
      <BountyUpdate
        issue={issue}
        bounty={bounty}
        submitBounties={submitBounties}
        description={description}
        tokens={tokens}
        updateBounty={updateBounty(issue.id)}
      />
    )
  }

  const bountylessIssues = []
  const alreadyAdded = []

  issues.forEach(issue => {
    if (issue.hasBounty) alreadyAdded.push(issue)
    else bountylessIssues.push(issue)
  })

  return (
    <React.Fragment>
      {(bountylessIssues.length > 0) && (
        <FundForm
          submitBounties={submitBounties}
          issues={bountylessIssues}
          bounties={bounties}
          description={description}
          tokens={tokens}
          descriptionChange={descriptionChange}
          updateBounty={updateBounty}
        />
      )}
      {(alreadyAdded.length > 0) && (
        <Info.Action title="Warning" style={{ marginBottom: `${2 * GU}px` }}>
          <p style={{ margin: '10px 0' }}>
          The following issues already have active bounties, so they have been discarded from this funding proposal:
          </p>
          <WarningIssueList>
            {alreadyAdded.map(issue => <li key={issue.id}>{issue.title}</li>)}
          </WarningIssueList>
        </Info.Action>
      )}
      {(!bountylessIssues.length) && <Button mode="strong" wide onClick={closePanel}>Close</Button>}
    </React.Fragment>
  )
}

FundIssues.propTypes = {
  issues: PropTypes.arrayOf(issueShape).isRequired,
  mode: PropTypes.oneOf([ 'new', 'update' ]).isRequired,
}

const UpdateRow = styled.div`
  display: flex;
  align-content: stretch;
  margin-bottom: ${2 * GU};
  > :first-child {
    width: 55%;
    padding-right: 10px;
  }
  > :last-child {
    width: 45%;
    padding-left: 10px;
  }
`
const WarningIssueList = styled.ul`
  padding: 10px 30px;
  font-size: 13px;
  > :not(:last-child) {
    margin-bottom: 10px;
  }
`

const InfoPanel = ({ imgSrc, title, message }) => {
  const theme = useTheme()

  return (
    <div css={`text-align: center; padding: ${4 * GU}px`}>
      <img src={imgSrc} alt='' css={`padding: ${GU}px 0`} />
      <div css={`padding: ${GU}px 0`}>
        <Text size='xxlarge'>
          {title}
        </Text>
      </div>
      <div css={`padding: ${GU}px 0`}>
        <Text size='medium' color={theme.contentSecondary.toString()}>
          {message}
        </Text>
      </div>
    </div>
  )
}

const ErrorText = styled.div`
  font-size: small;
  display: flex;
  align-items: center;
  margin: ${2 * GU}px 0;
`

const X = styled(IconClose).attrs({
  size: 'tiny',
})`
  margin-right: 8px;
  color: ${p => p.theme.negative};
`

const ErrorMessage = ({ text }) => {
  const theme = useTheme()
  return (
    <ErrorText>
      <X theme={theme} />
      {text}
    </ErrorText>
  )
}

ErrorMessage.propTypes = {
  text: PropTypes.string.isRequired,
}

export default FundIssues
