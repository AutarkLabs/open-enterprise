import React from 'react'
import styled from 'styled-components'
import { theme, Field, TextInput, Button, Info } from '@aragon/ui'

class Settings extends React.Component {
  state = {
    bounties: {
      'XS': 1,
      'S': 2,
      'M': 3,
      'L': 4,
      'XL': 5,
    },
    RPH: 30,
    err: ''
  }

  generateHoursHandler = bountyName => {
    return event => {
      console.log('changing ' + bountyName + ' to ' + event.target.value)
      const { bounties } = this.state
      bounties[bountyName] = event.target.value
      this.setState({bounties: bounties})
    }
  }

  handleRPHChange = event => {
    console.log('changing RPH to ' + event.target.value)
    this.setState({'RPH': event.target.value})
  }

  handleSubmit = () => {
    console.log('handleSubmit')
  }

  render () {
    const bountyNames = ['XS','S','M','L','XL']
    const { bounties, err } = this.state

    return (
      <Main>
        <Title>Bounty Amounts</Title>
        <Description>Define the hour estimates that are associated with each bounty size</Description>
        <Form onSubmit={this.handleSubmit}>
          {
          (err) && (
            <Info background={theme.negative} title="Error">
              {err}
            </Info>
          )}
          { bountyNames.map((bountyName) => {
              const changeHours = this.generateHoursHandler(bountyName)
              return (
                <Field key={bountyName} label={bountyName}>
                  <TextInput
                    value={bounties[bountyName]}
                    onChange={changeHours}
                    required
                  />
                  <Label>Hours</Label>
                </Field>
              )
            })
          }
          <Horizontal />
          <Title>Base Rate</Title>
          <Description>Define your organizations hourly rate. This is multiplied by the bounty size to determine bounty amount.</Description>
          <Field label="Rate per hour">
            <TextInput
              value={this.state.RPH}
              onChange={this.handleRPHChange}
              required
            />
            <Label>USD</Label>
          </Field>
          <Button mode="strong" type="submit" onClick>
             Submit
          </Button>
        </Form>

      </Main>
    )
  }
}

const Main = styled.div`
  margin: 0px;
`
const Form = styled.form`
  margin: 0px;
`
const Label = styled.span`
  margin-left: 6px;
  font-weight: bold;
`
const Description = styled.div`
  font-size: 14px;
  margin-bottom: 10px;
`
const Title = styled.div`
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 20px;
`
const Horizontal = styled.hr`
  border: 0;
  height: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  margin-top: 20px;
  margin-bottom: 20px;
`
export default Settings

