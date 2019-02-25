import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { addHours } from 'date-fns'

import {
  Field,
  Text,
  TextInput,
  DropDown,
  theme,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableCell,
} from '@aragon/ui'

import { Form, FormField, FieldTitle, DateInput } from '../../Form'
import { IconBigArrowDown, IconBigArrowUp } from '../../Shared'

const bountyHours = ['-', '1', '2', '4', '8', '16', '24', '32', '40']
const bountySlots = ['1', '2', '3']

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
    this.state = {
      description: '',
      bounties,
    }
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
    const expLevels = this.getExpLevels()
    let size = bountyHours[bounties[id]['hours']] * this.props.bountySettings.baseRate * expLevels[bounties[id]['exp']].mul
    bounties[id]['size'] = size

    this.setState({ bounties })
    console.log('configBounty: ', bounties)
  }

  generateHoursChange = id => index => {
    this.configBounty(id, 'hours', index)
    console.log('generateHoursChange: id: ', id, ', index: ', index)
  }

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

  render() {
    const { bounties } = this.state
    const { bountySettings } = this.props
    const expLevels = this.getExpLevels()

    //console.log('bounties: ', bounties, ', bountySettings: ', bountySettings)
    return (
      <Form
        onSubmit={this.submitBounties}
        description={this.props.description}
        submitText="Submit Bounty Allocation"
      >
        {/* Not currently implemented:
        <FormField
          label="Description"
          required
          input={
            <TextInput.Multiline
              rows={3}
              style={{ resize: 'none' }}
              onChange={this.descriptionChange}
              wide
            />
          }
        />*/}
        <FormField
          label="Issues"
          hint="Enter the estimated hours per issue"
          required
          input={
            <Table>
              {this.props.issues.map(issue => (
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
                            <DropDown
                              items={bountyHours}
                              onChange={this.generateHoursChange(issue.id)}
                              active={bounties[issue.id]['hours']}
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
                        </IBAvail>
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
}

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
