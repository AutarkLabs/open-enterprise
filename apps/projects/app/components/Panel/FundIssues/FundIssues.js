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

import {
  Box,
  Text,
  TextInput,
  DropDown,
  useTheme,
  Badge,
  Tag,
  GU,
  Button,
  Info,
} from '@aragon/ui'

import { Form, FormField, FieldTitle, DescriptionInput } from '../../Form'
import { DateInput } from '../../../../../../shared/ui'
import { Mutation } from 'react-apollo'
import { COMMENT } from '../../../utils/gql-queries'
import { issueShape } from '../../../utils/shapes.js'

const BountyUpdate = ({
  issue,
  bounties,
  bountySettings,
  submitBounties,
  description,
  generateHoursChange,
  tokenDetails,
  generateExpChange,
  generateDeadlineChange,
}) => {
  const expLevels = bountySettings.expLvls

  return (
    <div css={`margin: ${2 * GU}px 0`}>
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
  descriptionChange,
  generateArrowChange,
  generateHoursChange,
  generateExpChange,
  generateDeadlineChange,
}) => {
  const expLevels = bountySettings.expLvls
  const theme = useTheme()

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
                    <Box key={issue.id} padding={0}>
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
                      `}>
                        <div css={`
                          grid-area: title;
                          padding: ${2 * GU}px ${2 * GU}px 0 ${2 * GU}px;
                          display: flex;
                          justify-content: space-between;
                        `}>

                          <DetailsArrow onClick={generateArrowChange(issue.id)}>
                            {bounties[issue.id]['detailsOpen'] ? (
                              <IconClose />
                            ) : (
                              <IconOpen />
                            )}
                          </DetailsArrow>

                          <Text size="large" weight="bold" css={`
                              width: 100%;
                              display: block;
                              white-space: nowrap;
                              overflow: hidden;
                              text-overflow: ellipsis;
                            `}>
                            {issue.title}
                          </Text>

                          {issue.id in bounties &&
                               bounties[issue.id]['hours'] > 0 && (
                            <Tag css="padding: 10px; margin-left: 10px; width: auto">
                              {bounties[issue.id]['size'].toFixed(2) + ' ' + tokenDetails.symbol}
                            </Tag>

                          )}
                        </div>

                        <div css={`grid-area: hours; padding-left: ${2 * GU}px`}>
                          <FieldTitle>Estimated Hours</FieldTitle>
                          <HoursInput
                            name="hours"
                            value={bounties[issue.id]['hours']}
                            onChange={generateHoursChange(issue.id)}
                            wide
                          />
                        </div>

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
                          display: none;
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
FundForm.propTypes = {
  bountySettings: PropTypes.object.isRequired,
  issues: PropTypes.arrayOf(issueShape),
  bounties: PropTypes.object.isRequired,
  submitBounties: PropTypes.func.isRequired,
  description: PropTypes.string.isRequired,
  totalSize: PropTypes.number.isRequired,
  tokenDetails: PropTypes.object.isRequired,
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

    for (let key in issues) {
      issuesArray.push({
        key: key,
        exp: bounties[issues[key].id].exp,
        fundingHistory: bounties[issues[key].id].fundingHistory,
        deadline: bounties[issues[key].id].deadline,
        ...issues[key],
      })
    }

    const ipfsAddresses = await computeIpfsString(issuesArray)
    const repoIds = issuesArray.map(issue => toHex(issue.repoId))
    const issueNumbers = issuesArray.map(issue => issue.number)
    const bountySizes = issuesArray.map(issue =>
      BigNumber(bounties[issue.id].size)
        .times(10 ** tokenDetails.decimals)
        .toString()
    )
    const tokenContracts = new Array(issuesArray.length).fill(tokenDetails.addr)
    const deadlines = new Array(issuesArray.length).fill(Date.now() + 8600)
    // @param _tokenTypes array of currency types: 0=ETH from current user's wallet, 1=ETH from vault, 20=ERC20 token from vault
    const tokenTypes = new Array(issuesArray.length).fill(1)

    // during development, sometimes this fails with a cryptic "cannot perform action" error
    // in case this happens in QA, let's leave this logging here to at least have some paper trail
    console.log( // eslint-disable-line
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
  width: 100%;
  display: inline-block;
  padding-top: 3px;
`
const VaultDiv = styled.div`
  text-align: center;
`
const DetailsArrow = styled.div`
  width: 24px;
  margin-right: 12px;
`

export default FundIssues
