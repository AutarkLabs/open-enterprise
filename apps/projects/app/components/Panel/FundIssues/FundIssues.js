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

import {
  Box,
  Text,
  TextInput,
  DropDown,
  useTheme,
  Badge,
  Tag,
  Button,
  Info,
} from '@aragon/ui'

import { Form, FormField, FieldTitle, DescriptionInput } from '../../Form'
import { DateInput } from '../../../../../../shared/ui'
import { IconBigArrowDown, IconBigArrowUp } from '../../Shared'
import { Mutation } from 'react-apollo'
import { COMMENT } from '../../../utils/gql-queries'
import { issueShape } from '../../../utils/shapes.js'

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

  const initBounties = () => {
    let bounties = {}
    if (mode === 'update') {
      const issue = issues[0]
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
    const newBounties = [...bounties]
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
    configBounty(id, 'hours', parseInt(value))

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
    
    for (let key in issues) issuesArray.push({ key: key, ...issues[key] })
    
    const ipfsString = await computeIpfsString(issuesArray)
    
    const idArray = issuesArray.map(issue => toHex(issue.repoId))
    const numberArray = issuesArray.map(issue => issue.number)
    const bountyArray = issuesArray.map(issue =>
      BigNumber(issue.size)
        .times(10 ** tokenDetails.decimals)
        .toString()
    )
    const tokenArray = new Array(issuesArray.length).fill(tokenDetails.addr)
    const dateArray = new Array(issuesArray.length).fill(Date.now() + 8600)
    const booleanArray = new Array(issuesArray.length).fill(true)
    
    api.addBounties(
      idArray,
      numberArray,
      bountyArray,
      dateArray,
      booleanArray,
      tokenArray,
      ipfsString,
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
        //         `Amount: ${issue.size.toFixed(2)} ${bountySymbol}\n` +
        //         `Deadline: ${issue.deadline.toUTCString()}`,
        //       subjectId: issue.key,
        //     },
        //   })
        // })
      },
      err => console.error(`error: ${err}`)
    )
  }

  const renderUpdateForm = (issue, bounties) => {
    const expLevels = bountySettings.expLvls

    return (
      <React.Fragment>
        <Info.Action title="Warning" style={{ marginBottom: '16px' }}>
          <p style={{ marginTop: '10px' }}>
            The updates you specify will overwrite the existing settings for the bounty.
          </p>
        </Info.Action>

        <Form
          onSubmit={submitBounties}
          description={description}
          submitText="Submit Update"
        >
          <FormField
            label="Issue"
            input={
              <React.Fragment>
                <Text.Block size="xxlarge" style={{ marginBottom: '16px' }}>
                  {issue.title}
                </Text.Block>
                <UpdateRow>
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
                  {bounties[issue.id]['hours'] > 0 && (
                    <Badge style={{ padding: '6px', marginTop: '14px', marginLeft: '6px' }}>
                      <Text size="large">
                        {bounties[issue.id]['size'].toFixed(2)}{' '}
                        {tokenDetails.symbol}
                      </Text>
                    </Badge>
                  )}

                  <FormField
                    label="Experience level"
                    input={
                      <DropDown
                        items={expLevels.map(exp => exp.name)}
                        onChange={generateExpChange(issue.id)}
                        active={bounties[issue.id]['exp']}
                      />
                    }
                  />
                </UpdateRow>

                <UpdateRow>
                  <FormField
                    label="Deadline"
                    input={
                      <DateInput
                        width="120px"
                        name='deadline'
                        value={bounties[issue.id]['deadline']}
                        onChange={generateDeadlineChange(issue.id)}
                      />
                    }
                  />
                  {/* second child needed - should be Slots in the future */}
                  <div></div>
                </UpdateRow>
              </React.Fragment>
            }
          />
        </Form>
      </React.Fragment>
    )
  }

  const renderForm = (issues, bounties) => {
    const expLevels = bountySettings.expLvls

    return (
      <div>
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
                  <DescriptionInput
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
                      <Box key={issue.id}>
                        <div css={`
                          display: grid;
                          grid-template-columns: 1fr 1fr;
                          grid-template-rows: auto;
                          grid-template-areas:
                          "title title"
                          "hours exp"
                          "deadline deadline";
                          grid-gap: 12px;
                          align-items: stretch;
                          `}
                        >
                          <div css="display: flex; grid-area: title">

                            <IBArrow onClick={generateArrowChange(issue.id)}>
                              {bounties[issue.id]['detailsOpen'] ? (
                                <IconBigArrowUp />
                              ) : (
                                <IconBigArrowDown />
                              )}
                            </IBArrow>

                            <Text size="normal" weight="bold">
                              {issue.title}
                            </Text>

                            {issue.id in bounties &&
                                 bounties[issue.id]['hours'] > 0 && (
                              <Tag
                                css="padding: 10px; margin-right: 10px;"
                              >
                                {bounties[issue.id]['size'].toFixed(2)}{' '}
                                {tokenDetails.symbol}
                              </Tag>
                
                            )}
                          </div>

                          <div css="grid-area: hours">

                            <FieldTitle>Estimated Hours</FieldTitle>
                            <HoursInput
                              name="hours"
                              value={bounties[issue.id]['hours']}
                              onChange={generateHoursChange(issue.id)}
                              wide
                            />
                          </div>
                          <div css="grid-area: exp">

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

                          <div css={`"grid-area: deadline; background: ${theme.border}`}>

                            <FormField
                              label="Deadline"
                              input={
                                <DateInput
                                  name='deadline'
                                  value={bounties[issue.id]['deadline']}
                                  onChange={generateDeadlineChange(issue.id)}
                                  wide
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
        {
          (
            totalSize > tokenDetails.balance
          ) ? (
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

  const renderWarning = issues => (
    <Info.Action title="Warning">
      <p style={{ margin: '10px 0' }}>
        The following issues already have bounties and cannot be updated on a bulk basis. To update an individual issue, select “Update Bounty” from the issue’s context menu.
      </p>
      <WarningIssueList>
        {issues.map(issue => <li key={issue.id}>{issue.title}</li>)}
      </WarningIssueList>
    </Info.Action>
  )

  const bountylessIssues = []
  const alreadyAdded = []

  if (!tokens.length || !tokenDetails.balance) {
    return (
      <div>
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
    return renderUpdateForm(issues[0], bounties)
  }

  issues.forEach(issue => {
    if (issue.hasBounty)
      alreadyAdded.push(issue)
    else
      bountylessIssues.push(issue)
  })

  if (bountylessIssues.length > 0 && alreadyAdded.length > 0) {
    return (
      <DivSeparator>
        {renderForm(bountylessIssues, bounties)}
        {renderWarning(alreadyAdded)}
      </DivSeparator>
    )
  } else if (bountylessIssues.length > 0) {
    return renderForm(bountylessIssues, bounties)
  }
  return (
    <DivSeparator>
      {renderWarning(alreadyAdded)}
      <Button mode="strong" wide onClick={closePanel}>Close</Button>
    </DivSeparator>
  )
}



FundIssues.propTypes = {
  issues: PropTypes.arrayOf(issueShape),
  mode: PropTypes.oneOf([ 'new', 'update' ]).isRequired,
}

const DivSeparator = styled.div`
  > :last-child {
    margin-top: 15px;
  }
`
const UpdateRow = styled.div`
  display: flex;
  align-content: stretch;
  margin-bottom: 10px;
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
const HoursInput = styled(TextInput.Number).attrs({
  mode: 'strong',
  step: '1',
  min: '0',
  max: '1000',
})`
  width: ${ props => props.width ? props.width: '100px' };
  display: inline-block;
  padding-top: 3px;
`
const VaultDiv = styled.div`
  text-align: center;
`
const IBArrow = styled.div`
  width: 24px;
`

export default FundIssues
