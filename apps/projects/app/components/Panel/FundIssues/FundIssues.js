/* eslint-disable react/prop-types */
// issues are validated using correct shape - eslint problem?
import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { addHours } from 'date-fns'
import BigNumber from 'bignumber.js'
import Icon from '../../Shared/assets/components/IconEmptyVault'
import { useAragonApi } from '../../../api-react'
import useGithubAuth from '../../../hooks/useGithubAuth'
import { usePanelManagement } from '..'
import { computeIpfsString } from '../../../utils/ipfs-helpers'
import { toHex } from 'web3-utils'
import { IconOpen, IconClose } from '../../../assets'
import NoFunds from '../../../assets/noFunds.svg'
import { IssueText } from '../PanelComponents'

import {
  Box,
  Text,
  TextInput,
  DropDown,
  useTheme,
  GU,
  Button,
  Info,
} from '@aragon/ui'

import { Form, FormField, FieldTitle, DateInput } from '../../Form'
import { Mutation } from 'react-apollo'
import { COMMENT } from '../../../utils/gql-queries'
import { issueShape } from '../../../utils/shapes.js'

const ETHER_TOKEN_FAKE_ADDRESS = '0x0000000000000000000000000000000000000000'

const BountyUpdate = ({
  issue,
  bounties,
  bountySettings,
  submitBounties,
  description,
  generateHoursChange,
  tokenDetails,
  tokens,
  amountChange,
  tokenSelect,
  generateExpChange,
  generateDeadlineChange,
}) => {
  const expLevels = bountySettings.expLvls
  return (
    <div css={`margin: ${2 * GU}px 0`}>
      <Form
        onSubmit={submitBounties}
        description={description}
        submitText="Submit"
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
                  tag={(issue.id in bounties && bounties[issue.id]['hours'] > 0) ? bounties[issue.id]['size'].toFixed(2) + ' ' + tokenDetails.symbol : ''}
                />
              </div>

              <UpdateRow>
                { bountySettings.baseRate === 0 ? (
                  <FormField
                    label="Amount"
                    input={
                      <HorizontalInputGroup>
                        <AmountInput
                          name="amount"
                          value={bounties[issue.id]['amount']}
                          onChange={e => amountChange(issue.id, e.target.value)}
                          wide
                        />
                        <TokenInput
                          name="token"
                          items={tokens.map(t => t.symbol)}
                          selected={tokens.indexOf(bounties[issue.id].token)}
                          onChange={i => tokenSelect(issue.id, i)}
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
                        value={bounties[issue.id]['hours']}
                        onChange={generateHoursChange(issue.id)}
                      />
                    }
                  />
                )}

                <FormField
                  label="Difficulty"
                  input={
                    <DropDown
                      items={expLevels.map(exp => exp.name)}
                      onChange={generateExpChange(issue.id)}
                      selected={bounties[issue.id]['exp']}
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
                      value={bounties[issue.id]['deadline']}
                      onChange={generateDeadlineChange(issue.id)}
                      width="100%"
                    />
                  }
                />
              </div>
            </React.Fragment>
          }
        />
      </Form>
    </div>
  )
}
BountyUpdate.propTypes = {
  issue: issueShape,
  bounties: PropTypes.object.isRequired,
  bountySettings: PropTypes.object.isRequired,
  submitBounties: PropTypes.func.isRequired,
  description: PropTypes.string.isRequired,
  generateHoursChange: PropTypes.func.isRequired,
  tokenDetails: PropTypes.object.isRequired,
  tokens: PropTypes.array.isRequired,
  amountChange: PropTypes.func.isRequired,
  tokenSelect: PropTypes.func.isRequired,
  generateExpChange: PropTypes.func.isRequired,
  generateDeadlineChange: PropTypes.func.isRequired,
}

const FundForm = ({
  bountySettings,
  issues,
  bounties,
  submitBounties,
  description,
  totalSize,
  tokenDetails,
  tokens,
  tokenSelect,
  amountChange,
  descriptionChange,
  generateArrowChange,
  generateHoursChange,
  generateExpChange,
  generateDeadlineChange,
}) => {
  const expLevels = bountySettings.expLvls
  const theme = useTheme()

  if (Number(tokenDetails.balance) === 0) {
    return (
      <InfoPanel
        imgSrc={NoFunds}
        title={'No funds found.'}
        message={'It seems that your organization has no funds available to fund issues. Navigate to the Finance app to deposit some funds first.'}
      />
    )
  }

  return (
    <div css={`margin: ${2 * GU}px 0`}>
      <Mutation mutation={COMMENT}>
        {(post, result) => (
          <Form
            onSubmit={() => submitBounties(post, result)}
            description={description}
            submitText={issues.length > 1 ? 'Fund Issues' : 'Fund Issue'}
            submitDisabled={totalSize > tokenDetails.balance}
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
                    <Box key={issue.id} padding={0}>
                      <div css={`
                        padding: ${2 * GU}px;
                        display: flex;
                      `}>
                        <DetailsArrow onClick={generateArrowChange(issue.id)}>
                          {bounties[issue.id]['detailsOpen'] ? (
                            <IconClose />
                          ) : (
                            <IconOpen />
                          )}
                        </DetailsArrow>
                        <IssueTitleCompact
                          title={issue.title}
                          tag={(issue.id in bounties && bounties[issue.id]['hours'] > 0) ? bounties[issue.id]['size'].toFixed(2) + ' ' + tokenDetails.symbol : ''}
                        />
                      </div>
                      <div css={`
                              display: grid;
                              grid-template-columns: minmax(1fr, 0) 1fr;
                              grid-template-rows: auto;
                              grid-template-areas:
                                "hours exp"
                                "deadline deadline";
                              grid-gap: 12px;
                              align-items: stretch;
                            `}>

                        {bountySettings.baseRate === 0 ? (
                          <div css={`grid-area: hours; padding-left: ${2 * GU}px`}>
                            <FieldTitle>Amount</FieldTitle>
                            <HorizontalInputGroup>
                              <AmountInput
                                name="amount"
                                value={bounties[issue.id]['amount']}
                                onChange={e => amountChange(issue.id, e.target.value)}
                                wide
                              />
                              <TokenInput
                                name="token"
                                items={tokens.map(t => t.symbol)}
                                selected={tokens.indexOf(bounties[issue.id].token)}
                                onChange={i => tokenSelect(issue.id, i)}
                              />
                            </HorizontalInputGroup>
                          </div>
                        ) : (
                          <div css={`grid-area: hours; padding-left: ${2 * GU}px`}>
                            <FieldTitle>Estimated Hours</FieldTitle>
                            <HoursInput
                              name="hours"
                              value={bounties[issue.id]['hours']}
                              onChange={generateHoursChange(issue.id)}
                              wide
                            />
                          </div>
                        )}

                        <div css={`grid-area: exp; padding-right: ${2 * GU}px`}>
                          <FormField
                            label="Experience level"
                            input={
                              <DropDown
                                items={expLevels.map(exp => exp.name)}
                                onChange={generateExpChange(issue.id)}
                                selected={bounties[issue.id]['exp']}
                                wide
                              />
                            }
                          />
                        </div>

                        <div css={`
                                grid-area: deadline;
                                background: ${theme.background};
                                border-top: 1px solid ${theme.border};
                                padding: 0 ${2 * GU}px;
                                display: ${bounties[issue.id]['detailsOpen'] ? 'block' : 'none'};
                              `}>
                          <FormField
                            label="Deadline"
                            input={
                              <DateInput
                                name='deadline'
                                value={bounties[issue.id]['deadline']}
                                onChange={generateDeadlineChange(issue.id)}
                                width="100%"
                              />
                            }
                          />
                        </div>
                      </div>
                    </Box>
                  ))}
                </React.Fragment>
              }
            />
          </Form>
        )}
      </Mutation>
      {(totalSize > tokenDetails.balance) ? (
        <div>
          <br />
          <Info.Action title="Insufficient Token Balance">
                    Please either mint more tokens or stake fewer tokens against these issues.
          </Info.Action>
        </div>
      ) : null
      }
    </div>
  )
}

FundForm.propTypes = {
  bountySettings: PropTypes.object.isRequired,
  issues: PropTypes.arrayOf(issueShape),
  bounties: PropTypes.object.isRequired,
  submitBounties: PropTypes.func.isRequired,
  description: PropTypes.string.isRequired,
  totalSize: PropTypes.number.isRequired,
  tokenDetails: PropTypes.object.isRequired,
  tokens: PropTypes.array.isRequired,
  tokenSelect: PropTypes.func.isRequired,
  amountChange: PropTypes.func.isRequired,
  descriptionChange: PropTypes.func.isRequired,
  generateArrowChange: PropTypes.func.isRequired,
  generateHoursChange: PropTypes.func.isRequired,
  generateExpChange: PropTypes.func.isRequired,
  generateDeadlineChange: PropTypes.func.isRequired,
}

const FundIssues = ({ issues, mode }) => {
  const githubCurrentUser = useGithubAuth()
  const theme = useTheme()
  const {
    api,
    appState: { bountySettings, tokens },
  } = useAragonApi()
  const { closePanel } = usePanelManagement()
  const [ description, setDescription ] = useState('')
  const [ totalSize, setTotalSize ] = useState(0)
  const [ bounties, setBounties ] = useState({})
  const [ tokenDetails, setTokenDetails ] = useState({})

  useEffect(() => {
    setBounties(initBounties())
    tokens.forEach(token =>
      token.addr === bountySettings.bountyCurrency && setTokenDetails(token))
  }, [ bountySettings, tokens ]
  )

  const descriptionChange = e => setDescription(e.target.value)
  const tokenSelect = (id, i) => {
    configBounty(id, 'token', tokens[i])
  }
  const amountChange = (id, value) => configBounty(id, 'amount', value)

  const initBounties = () => {
    let bounties = {}
    if (mode === 'update') {
      const issue = issues[0]
      let token
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].symbol === issue.symbol) {
          token = tokens[i]
        }
      }
      bounties[issue.id] = {
        repo: issue.repo,
        number: issue.number,
        repoId: issue.repoId,
        hours: issue.hours,
        exp: issue.exp,
        deadline: new Date(issue.deadline),
        slots: 1,
        slotsIndex: 0,
        size: 0,
        amount: issue.balance,
        token,
      }
      bounties[issue.id].size = calculateSize(bounties[issue.id])
    } else {
      issues.map(issue => {
        bounties[issue.id] = {
          repo: issue.repo,
          number: issue.number,
          repoId: issue.repoId,
          hours: 0,
          exp: 0,
          deadline: addHours(new Date(), bountySettings.bountyDeadline),
          slots: 1,
          slotsIndex: 0,
          detailsOpen: 0,
          size: 0,
          amount: '',
          token: tokens[0],
        }
      })
    }
    return bounties
  }

  const calculateSize = issue => {
    const expLevels = bountySettings.expLvls
    return issue['hours'] *
      bountySettings.baseRate *
      expLevels[issue['exp']].mul
  }

  const configBounty = (id, key, val) => {
    const newBounties = { ...bounties }
    // arrow clicked - it's simple value reversal case, 1 indicates details are open, 0 - closed
    if (key === 'detailsOpen') {
      newBounties[id][key] = 1 - newBounties[id][key]
    } else {
      newBounties[id][key] = val
    }
    // just do it, recalculate size
    newBounties[id]['size'] = calculateSize(newBounties[id])
    const bountyValues = Object.values(newBounties)
    const bountyTotal = bountyValues.reduce((acc,val) => BigNumber(val.size).plus(acc), 0)
      .times(10 ** tokenDetails.decimals)
      .toNumber()

    setBounties(newBounties)
    setTotalSize(bountyTotal)
  }

  const generateHoursChange = id => ({ target: { value } }) =>
    configBounty(id, 'hours', parseFloat(value))

  const generateExpChange = id => index => {
    configBounty(id, 'exp', index)
  }

  const generateDeadlineChange = id => deadline => {
    configBounty(id, 'deadline', deadline)
  }

  const generateArrowChange = id => () => {
    configBounty(id, 'detailsOpen')
  }

  const submitBounties = async () => {
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
        hours: bounties[issues[key].id].hours,
        size: bounties[issues[key].id].size,
        amount: bounties[issues[key].id].amount,
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
      if (bountySettings.baseRate === 0) {
        const tokenAddress = mode === 'update' ? issue.token : issue.token.addr
        const tokenDecimals = mode === 'update' ? 18 : issue.token.decimals
        tokenContracts.push(tokenAddress)
        bountySizes.push(
          BigNumber(issue.amount).times(10 ** tokenDecimals).toString()
        )
        tokenTypes.push(tokenAddress === ETHER_TOKEN_FAKE_ADDRESS ? 1 : 20)
      }
      else {
        tokenContracts.push(tokenDetails.addr)
        bountySizes.push(
          BigNumber(issue.size)
            .times(10 ** tokenDetails.decimals)
            .toString()
        )
        tokenTypes.push(tokenDetails.addr === ETHER_TOKEN_FAKE_ADDRESS ? 1 : 20)
      }
    }
    const deadlines = Object.keys(bounties).map(
      id => bounties[id]['deadline'].getTime()
    )

    // during development, sometimes this fails with a cryptic "cannot perform action" error
    // in case this happens in QA, let's leave this logging here to at least have some paper trail
    console.log( // eslint-disable-line
      'ipfs file', issuesArray,
      'bounties', bounties,
      'repoIds', repoIds,
      'issueNumbers', issueNumbers,
      'bountySizes', bountySizes,
      'deadlines', deadlines,
      'tokenTypes', tokenTypes,
      'tokenContracts', tokenContracts,
      'ipfsAddresses', ipfsAddresses,
      'description', description
    )
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
        //         `Amount: ${issue.size.toFixed(2)} ${tokenDetails.symbol}\n` +
        //         `Deadline: ${issue.deadline.toUTCString()}`,
        //       subjectId: issue.key,
        //     },
        //   })
        // })
      },
      err => console.error(`error: ${err}`)
    )
  }

  const bountylessIssues = []
  const alreadyAdded = []

  if (!tokens.length || !tokenDetails.balance) {
    return (
      <div css={`margin-top: ${2 * GU}px`}>
        <VaultDiv><Icon /></VaultDiv>
        <Text color={`${theme.surfaceContentSecondary}`} size='large' >
          <div>
            <br />
            Your base rate has not been set and you do not have
            any tokens in your Vault.
            <br /> <br />
            Once you have tokens in your Vault, you will be
            able to begin funding issues.
            <br /> <br />
            <Button wide onClick={closePanel} mode="strong">Cancel</Button>
          </div>
        </Text>
      </div>
    )
  }

  // in 'update' mode there is only one issue
  if (mode === 'update') {
    return (
      <BountyUpdate
        issue={issues[0]}
        bounties={bounties}
        bountySettings={bountySettings}
        submitBounties={submitBounties}
        description={description}
        generateHoursChange={generateHoursChange}
        tokenDetails={tokenDetails}
        tokens={tokens}
        amountChange={amountChange}
        tokenSelect={tokenSelect}
        generateExpChange={generateExpChange}
        generateDeadlineChange={generateDeadlineChange}
      />
    )
  }

  issues.forEach(issue => {
    if (issue.hasBounty)
      alreadyAdded.push(issue)
    else
      bountylessIssues.push(issue)
  })

  return (
    <React.Fragment>
      {(bountylessIssues.length > 0) && (
        <FundForm
          submitBounties={submitBounties}
          bountySettings={bountySettings}
          issues={bountylessIssues}
          bounties={bounties}
          description={description}
          totalSize={totalSize}
          tokenDetails={tokenDetails}
          tokens={tokens}
          tokenSelect={tokenSelect}
          amountChange={amountChange}
          descriptionChange={descriptionChange}
          generateArrowChange={generateArrowChange}
          generateHoursChange={generateHoursChange}
          generateExpChange={generateExpChange}
          generateDeadlineChange={generateDeadlineChange}
        />
      )}
      {(alreadyAdded.length > 0) && (
        <Info.Action title="Warning" style={{ marginBottom: `${2 * GU}px` }}>
          <p style={{ margin: '10px 0' }}>
          The following issues already have bounties and cannot be updated on a bulk basis. To update an individual issue, select “Update Bounty” from the issue’s context menu.
          </p>
          <WarningIssueList>
            {issues.map(issue => <li key={issue.id}>{issue.title}</li>)}
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
    width: 50%;
    padding-right: 10px;
  }
  > :last-child {
    width: 50%;
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
const HorizontalInputGroup = styled.div`
  display: flex;
`
const HoursInput = styled(TextInput.Number).attrs({
  step: '0.25',
  min: '0',
})`
  width: 100%;
  display: inline-block;
  padding-top: 3px;
`
const AmountInput = styled(TextInput.Number).attrs({
  step: 'any',
  min: '1e-18',
})`
  width: 100%;
  display: inline-block;
  padding-top: 3px;
  border-radius: 4px 0 0 4px;
`
const TokenInput = styled(DropDown)`
  border-radius: 0 4px 4px 0;
  left: -1px;
`
const VaultDiv = styled.div`
  text-align: center;
`
const DetailsArrow = styled.div`
  width: 24px;
  margin-right: 12px;
`
const IssueAmount = styled.span`
  display: flex;
`
const TextTag = styled(Text).attrs({
  size: 'small',
  weight:'bold',
})`
  padding: 0 10px;
  margin-left: 10px;
  white-space: nowrap;
  width: auto;
  height: 24px;
  line-height: 28px;
  border-radius: 24px;
  text-transform: uppercase;
  color: ${props => props.theme.tagIndicatorContent};
  background: ${props => props.theme.tagIndicator};
`

const IssueTitleCompact = ({ title, tag = '' }) => {
  const theme = useTheme()

  return (
    <React.Fragment>
      <IssueText>
        <Text >{title}</Text>
      </IssueText>
      {tag && (
        <IssueAmount>
          <TextTag theme={theme}>
            {tag}
          </TextTag>
        </IssueAmount>
      )}
    </React.Fragment>
  )
}
IssueTitleCompact.propTypes = {
  title: PropTypes.string.isRequired,
  tag: PropTypes.string,
}

const InfoPanel = ({ imgSrc, title, message }) => {
  const theme = useTheme()

  return (
    <div css={`
        text-align:center;
        padding: 30px;
      `}>
      <img src={imgSrc} alt='' css={`
          padding: 10px 0;
        `}/>
      <div css={`
          padding: 10px 0;
        `}>
        <Text size='xxlarge'>
          {title}
        </Text>
      </div>
      <div css={`
          padding: 10px 0;
        `}>
        <Text size='medium' color={theme.contentSecondary}>
          {message}
        </Text>
      </div>
    </div>
  )
}

export default FundIssues
