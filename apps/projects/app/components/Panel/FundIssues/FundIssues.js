import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { addHours } from 'date-fns'
import BigNumber from 'bignumber.js'
import Icon from '../../Shared/assets/components/IconEmptyVault'

import {
  Button,
  Text,
  TextInput,
  DropDown,
  theme,
  Badge,
  Table,
  TableRow,
  TableCell,
  Info
} from '@aragon/ui'

import {
  DateInput,
  Form,
  FormField,
  FieldTitle,
  DescriptionInput
} from '../../Form'
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
        repoId: PropTypes.string,
      })
    ),
    /** base rate in pennies */
    baseRate: PropTypes.number,
    tokens: PropTypes.array.isRequired,
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
        deadline: addHours(
          new Date(),
          this.props.bountySettings.bountyDeadline
        ),
        slots: 1,
        slotsIndex: 0,
        detailsOpen: 0,
        size: 0,
      }
    })
    let bountySymbol = this.props.bountySettings.bountyCurrency
    let bountyToken, tokenDecimals, tokenBalance
    this.props.tokens.forEach(
      token => {
        if(token.symbol === bountySymbol) {
          bountyToken = token.addr
          tokenDecimals = token.decimals
          tokenBalance = token.balance
        }
      }
    )
    this.state = {
      description: '',
      bounties,
      tokenBalance,
      tokenDecimals,
      totalSize: 0,
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
    const expLevels = this.props.bountySettings.expLvls
    let size = bounties[id]['hours'] * this.props.bountySettings.baseRate * expLevels[bounties[id]['exp']].mul
    bounties[id]['size'] = size
    const bountyValues = Object.values(this.state.bounties)
    const bountyTotal = bountyValues.reduce((acc,val) => BigNumber(val.size).plus(acc), 0)
      .times(10 ** this.state.tokenDecimals)
      .toNumber()
    this.setState({ bounties, totalSize: bountyTotal })
  }

  generateHoursChange = id => ({ target: { value } }) =>
    this.configBounty(id, 'hours', parseInt(value))

  generateExpChange = id => index => {
    this.configBounty(id, 'exp', index)
  }

  generateDeadlineChange = id => deadline => {
    this.configBounty(id, 'deadline', deadline)
  }

  generateSlotsChange = id => index => {
    this.configBounty(id, 'slotsIndex', index)
  }

  generateArrowChange = id => () => {
    this.configBounty(id, 'detailsOpen')
  }

  submitBounties = () => {
    this.props.onSubmit(this.state.bounties, this.state.description)
  }

  render() {
    const { bounties } = this.state
    const { bountySettings, tokens, closePanel } = this.props
    const expLevels = this.props.bountySettings.expLvls

    if (!tokens.length) {
      return (
        <div>
          <VaultDiv><Icon /></VaultDiv>
          <Text color={theme.textSecondary} size='large' >
            <div>
              <br />
            Your base rate has not been set and you do not have
            any tokens in your Finance app.
              <br /> <br />
            Once you have tokens in your Finance app, you will be
            able to begin allocating tokens to issues.
              <br /> <br />
              <Button wide onClick={closePanel} mode="strong"  >Cancel</Button>
            </div>
          </Text>
        </div>
      )
    }

    return (
      <div>
        <Form
          onSubmit={this.submitBounties}
          description={this.props.description}
          submitText={this.props.issues.length > 1 ? 'Fund Issues' : 'Fund Issue'}
          submitDisabled={this.state.totalSize > this.state.tokenBalance}
        >
          <FormField
            label="Description"
            required
            input={
              <DescriptionInput
                rows={3}
                style={{ resize: 'none' }}
                onChange={this.descriptionChange}
                wide
              />
            }
          />
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
                          </IBAvail>
                           */}
                        </IBDetails>
                      </IBMain>
                    </Cell>
                  </TableRow>
                ))}
              </Table>
            }
          />
        </Form>
        {
          (
            this.state.totalSize > this.state.tokenBalance
          ) ? (
              <div>
                <br />
                <Info.Action title="Insufficient Token Balance">
                Please either mint more tokens or stake fewer tokens against these bounties
                </Info.Action>
              </div>
            ) : null
        }
      </div>
    )
  }
}

const HoursInput = styled(TextInput.Number).attrs({
  mode: 'strong',
  step: '1',
  min: '0',
  max: '1000',
})`
  width: 100px;
  height: 32px;
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
const VaultDiv = styled.div`
text-align: center;
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
