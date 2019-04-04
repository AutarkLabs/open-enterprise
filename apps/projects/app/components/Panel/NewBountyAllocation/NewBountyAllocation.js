import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { addHours } from 'date-fns'

import {
  Text,
  TextInput,
  DropDown,
  theme,
  Badge,
  Table,
  Info,
  TableRow,
  TableCell,
  Button,
} from '@aragon/ui'

import { Form, FormField, FieldTitle } from '../../Form'
import { DateInput } from '../../../../../../shared/ui'
import { IconBigArrowDown, IconBigArrowUp } from '../../Shared'

const bountySlots = [ '1', '2', '3' ]

class NewBountyAllocation extends React.Component {
  static propTypes = {
    /** array of issues to allocate bounties on */
    issues: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        level: PropTypes.string,
        title: PropTypes.string,
        number: PropTypes.number,
        repo: PropTypes.string,
        repoId: PropTypes.string
      })
    ),
    /** base rate in pennies */
    baseRate: PropTypes.number,
    onSubmit: PropTypes.func.isRequired,
  }

  descriptionChange = e => {
    this.setState({ description: e.target.value })
  }

  constructor(props) {
    super(props)
    let bounties = {}

    if (this.props.mode === 'update') {
      const issue = this.props.issues[0]
      bounties[issue.id] = {
        repo: issue.repo,
        number: issue.number,
        repoId: issue.repoId,
        hours: issue.hours,
        exp: issue.exp,
        deadline: new Date(issue.deadline),
        slots: 1,
        slotsIndex: 0,
        size: 0
      }
      bounties[issue.id].size = this.calculateSize(bounties[issue.id])
    } else {
      this.props.issues.map(issue => {
        bounties[issue.id] = {
          repo: issue.repo,
          number: issue.number,
          repoId: issue.repoId,
          hours: 0,
          exp: 0,
          deadline: addHours(new Date(), this.props.bountySettings.bountyDeadline),
          slots: 1,
          slotsIndex: 0,
          detailsOpen: 0,
          size: 0
        }
      })
    }

    this.state = {
      description: '',
      bounties,
    }
  }

  calculateSize = issue => {
    const expLevels = this.getExpLevels()
    return issue['hours'] *
      this.props.bountySettings.baseRate *
      expLevels[issue['exp']].mul
  }

  configBounty = (id, key, val) => {
    const { bounties } = this.state
    // arrow clicked - it's simple value reversal case, 1 indicates details are open, 0 - closed
    if (key === 'detailsOpen') {
      bounties[id][key] = 1 - bounties[id][key]
    } else {
      bounties[id][key] = val
      if (key === 'slotsIndex') {
        // slotsIndex governs DropDown. real value is in 'slots'
        bounties[id]['slots'] = bountySlots[val]
      }
    }
    // just do it, recalculate size
    bounties[id]['size'] = this.calculateSize(bounties[id])

    this.setState({ bounties })
    //console.log('configBounty: ', bounties)
  }

  generateHoursChange = id => ({ target: { value } }) => this.configBounty(id, 'hours', parseInt(value))

  generateExpChange = id => index => {
    this.configBounty(id, 'exp', index)
    console.log('generateExpChange: id: ', id, ', index: ', index)
  }

  generateDeadlineChange = id => deadline => {
    this.configBounty(id, 'deadline', deadline)
  }

  generateSlotsChange = id => index => {
    this.configBounty(id, 'slotsIndex', index)
    console.log('generateExpChange: id: ', id, ', index: ', index)
  }

  generateArrowChange = id => () => {
    this.configBounty(id, 'detailsOpen')
    console.log('generateArrowChange: id: ', id)
  }

  submitBounties = () => {
    console.info('Submitting new Bounties', this.state.bounties)
    this.props.onSubmit(this.state.bounties)
  }

  // TODO: make it smarter. exp levels are quite constant, but they might not
  // be immediately available
  getExpLevels = () => {
    let expLevels = []
    let a = this.props.bountySettings.expLevels.split('\t')
    for (let i = 0; i < a.length; i += 2)
      expLevels.push({ mul: a[i] / 100, name: a[i + 1] })
    return expLevels
  }

  renderUpdateForm = (issue, bounties, bountySettings) => {
    const expLevels = this.getExpLevels()

    return (
      <React.Fragment>
        <Info.Action title="Warning" style={{ marginBottom: '16px' }}>
          <p style={{ marginTop: '10px' }}>
            The updates you specify will overwrite the existing settings for the bounty.
          </p>
        </Info.Action>

        <Form
          onSubmit={this.submitBounties}
          description={this.props.description}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <FormField
                      label="Hours"
                      input={
                        <HoursInput
                          width="100%"
                          name="hours"
                          value={bounties[issue.id]['hours']}
                          onChange={this.generateHoursChange(issue.id)}
                        />
                      }
                    />
                    {bounties[issue.id]['hours'] > 0 && (
                      <Badge style={{ padding: '6px', marginTop: '14px', marginLeft: '6px' }}>
                        <Text size="large">
                          {bounties[issue.id]['size'].toFixed(2)}{' '}
                          {bountySettings.bountyCurrency}
                        </Text>
                      </Badge>
                    )}
                  </div>

                  <FormField
                    label="Experience level"
                    input={
                      <DropDown
                        items={expLevels.map(exp => exp.name)}
                        onChange={this.generateExpChange(issue.id)}
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
                        onChange={this.generateDeadlineChange(issue.id)}
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

  renderForm = (issues, bounties, bountySettings) => {
    const expLevels = this.getExpLevels()

    return (
      <Form
        onSubmit={this.submitBounties}
        description={this.props.description}
        submitText="Submit Bounty Allocation"
      >
        <FormField
          label="Issues"
          hint="Enter the estimated hours per issue"
          required
          input={
            <Table>
              {issues.map(issue => (
                <TableRow key={issue.id}>
                  <Cell>
                    <IBMain>
                      <IssueBounty>
                        <IBArrow onClick={this.generateArrowChange(issue.id)}>
                          {bounties[issue.id]['detailsOpen'] ? (
                            <IconBigArrowUp />
                          ) : (
                            <IconBigArrowDown />
                          )}
                        </IBArrow>
                        <IBTitle size="normal" weight="bold">
                          {issue.title}
                        </IBTitle>
                        <IBHours>
                          <IBHoursInput>
                            <FieldTitle>Hours</FieldTitle>
                            <HoursInput
                              name="hours"
                              value={bounties[issue.id]['hours']}
                              onChange={this.generateHoursChange(issue.id)}
                            />
                          </IBHoursInput>
                        </IBHours>
                        <IBValue>
                          {issue.id in bounties &&
                            bounties[issue.id]['hours'] > 0 && (
                            <IBValueShow>
                              <FieldTitle>Value</FieldTitle>
                              <Badge style={{ marginLeft: '5px' }}>
                                {bounties[issue.id]['size'].toFixed(2)}{' '}
                                {bountySettings.bountyCurrency}
                              </Badge>
                            </IBValueShow>
                          )}
                        </IBValue>
                      </IssueBounty>
                      <IBDetails open={bounties[issue.id]['detailsOpen']}>
                        <IBExp>
                          <FormField
                            label="Experience level"
                            input={
                              <DropDown
                                items={expLevels.map(exp => exp.name)}
                                onChange={this.generateExpChange(issue.id)}
                                active={bounties[issue.id]['exp']}
                              />
                            }
                          />
                        </IBExp>
                        <IBDeadline>
                          <FormField
                            label="Deadline"
                            input={
                              <DateInput
                                name='deadline'
                                value={bounties[issue.id]['deadline']}
                                onChange={this.generateDeadlineChange(issue.id)}
                              />
                            }
                          />
                        </IBDeadline>
                        {/*
                        Can add back in when we support multiple slots
                        <IBAvail>
                          <FormField
                            label="Slots Available"
                            input={
                              <DropDown
                                items={bountySlots}
                                onChange={this.generateSlotsChange(issue.id)}
                                active={bounties[issue.id]['slotsIndex']}
                              />
                            }
                          />
                        </IBAvail> */}
                      </IBDetails>
                    </IBMain>
                  </Cell>
                </TableRow>
              ))}
            </Table>
          }
        />
      </Form>
    )
  }

  renderWarning = issues => (
    <Info.Action title="Warning">
      <p style={{ margin: '10px 0' }}>
        The following issues already have bounties and cannot be updated on a bulk basis. To update an individual issue, select “Update Bounty” from the issue’s context menu.
      </p>
      <WarningIssueList>
        {issues.map(issue => <li>{issue.title}</li>)}
      </WarningIssueList>
    </Info.Action>
  )

  render() {
    const { bounties } = this.state
    const { bountySettings, mode, issues } = this.props
    const bountylessIssues = []
    const alreadyAdded = []

    // in 'update' mode there is only one issue
    if (mode === 'update') {
      return this.renderUpdateForm(issues[0], bounties, bountySettings)
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
          {this.renderForm(bountylessIssues, bounties, bountySettings)}
          {this.renderWarning(alreadyAdded)}
        </DivSeparator>
      )
    } else if (bountylessIssues.length > 0) {
      return this.renderForm(bountylessIssues, bounties, bountySettings)
    } else return (
      <DivSeparator>
        {this.renderWarning(alreadyAdded)}
        <Button mode="strong" wide onClick={this.props.closePanel}>Close</Button>
      </DivSeparator>
    )
  }
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
const Cell = styled(TableCell)`
  padding: 0;
`
const IBMain = styled.div`
  display: flex;
  flex-flow: column;
`
const IssueBounty = styled.div`
  clear: all;
  display: grid;
  grid-template-columns: 41px 173px 173px;
  grid-template-rows: auto;
  grid-template-areas:
    'arrow title title'
    'arrow hours value';
`
const IBTitle = styled(Text)`
  grid-area: title;
  line-height: 24px;
  padding-top: 12px;
  padding-bottom: 8px;
`
const IBHours = styled.div`
  grid-area: hours;
`
const IBExp = styled.div`
  grid-area: exp;
`
const IBDetails = styled.div`
  display: ${({ open }) => (open ? 'grid' : 'none')};
  background: ${theme.mainBackground};
  padding-top: 12px;
  grid-template-columns: 41px 173px 173px;
  grid-template-rows: auto;
  grid-template-areas:
    '.     exp   dline'
    '.     slots .    ';
`
const IBDeadline = styled.div`
  grid-area: dline;
`
const IBAvail = styled.div`
  grid-area: slots;
`
const IBValue = styled.div`
  grid-area: value;
`
const IBValueShow = styled.div`
  display: inline-flex;
  position: relative;
  justify-content: center;
  > :first-child {
    height: 40px;
    line-height: 40px;
  }
  > :last-child {
    margin: 10px 0;
  }
`
const IBArrow = styled.div`
  grid-area: arrow;
  place-self: center; // TODO: Check browser support for this
`
const IBHoursInput = styled.div`
  display: inline-flex;
  position: relative;
  margin-bottom: 10px;
  > :first-child {
    height: 40px;
    width: 45px;
    line-height: 40px;
  }
  > :last-child {
    width: 65px;
    height: 40px;
  }
`

export default NewBountyAllocation
