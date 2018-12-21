import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import {
//  Button,
  Field,
  Text,
  TextInput,
  DropDown,
  theme,
  Badge,
//  Info,
  Table, TableHeader, TableRow, TableCell
} from '@aragon/ui'

import {
//  DescriptionInput,
  Form,
  FormField,
  FieldTitle,

//  OptionsInput,
//  SettingsInput,
//  InputDropDown,
} from '../../Form'

class NewBountyAllocation extends React.Component {
  state = NewBountyAllocation.initialState
  static propTypes = {
    /** array of issues to allocate bounties on */
    issues: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        level: PropTypes.string,
      })
    ),
    /** base rate in pennies */
    rate: PropTypes.number,
    onSubmit: PropTypes.func.isRequired,
  }

  static initialState = {
    description: '',
    bounties: {}
  }

  descriptionChange = e => {
    this.setState({ description: e.target.value })
  }

  generateHoursChange = id => (index) => {
    const { bounties } = this.state
    bounties[id] = index
    console.log('generateHoursChange: id: ', id, ', index: ', index, ', bounties: ', bounties)
    this.setState({bounties})
  }

  render() {
    const bountyHours = ['-', '5', '10', '15']
    const { bounties } = this.state

    return (
      <Form
        onSubmit={this.props.onSubmit}
        description={this.props.description}
        submitText="Submit Bounty Allocation"
      >
        <FormField label="Description"
          required
          input={
            <TextInput.Multiline
              rows={3}
              style={{ resize: 'none' }}
              onChange={this.descriptionChange}
              wide
            />
          }
        />
        <FormField label="Issues"
          hint="Enter the estimated hours per issue"
          required
          input={
            <Table>
              {
              this.props.issues.map(issue => (
                <TableRow>
                  <Cell key={issue.id}>
                    <IssueBounty>
                      <IBArrow> > </IBArrow>
                      <IBTitle size='normal' weight="bold">{issue.title}</IBTitle>
                      <IBHours>
                        <IBHoursInput>
                          <FieldTitle>Hours</FieldTitle>
                          <DropDown
                            items={bountyHours}
                            onChange={this.generateHoursChange(issue.id)}
                            active={bounties[issue.id]}
                          />
                        </IBHoursInput>
                      </IBHours>
                      <IBValue>
                      {(issue.id in bounties && bounties[issue.id] > 0) && (
                        <IBValueShow>
                          <FieldTitle>$100</FieldTitle>
                          <Badge>10 ANT</Badge>
                        </IBValueShow>
                      )}
                      </IBValue>
                    </IssueBounty>
                  </Cell>
                </TableRow>
              ))
              }
            </Table>
          }
        />
      </Form>
    )
  }
}

const Cell = styled(TableCell)`
  padding: 0px;
`
const IssueBounty = styled.div`
  display: grid;
  grid-template-columns: 41px 159px auto;
  grid-template-rows: auto;
  grid-template-areas:
    "arrow title title"
    "arrow hours value";
`
const IBTitle = styled(Text)`
    grid-area: title;
    line-height: 42px;
}
`
const IBHours = styled.div`
    grid-area: hours;
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
    width: 45px;
    line-height: 40px;
  }
  > :last-child {
margin: 10px 0px;
  }
`
const IBArrow = styled.div`
  grid-area: arrow;
  place-self: center;
  transform: rotate(-90deg);
  font-size: 17px;
  line-height: 17px;
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
