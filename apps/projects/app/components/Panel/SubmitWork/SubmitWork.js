import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import {
  Field,
  Text,
  TextInput,
  theme,
  Info,
  SafeLink,
  IconAttention
} from '@aragon/ui'

import { Form, FormField, FieldTitle } from '../../Form'
import { IconGitHub, CheckButton } from '../../Shared'

class SubmitWork extends React.Component {

  static propTypes = {
    issue: PropTypes.object.isRequired
  }

  state = {
    proof: '',
    comments: '',
    hours: 0,
    ack1: false,
    ack2: false
  }

  changeField = ({ target: { name, value } }) => this.setState({ [name]: value })
  setAck1 = () => this.setState(prevState => ({ ack1: !prevState.ack1 }))
  setAck2 = () => this.setState(prevState => ({ ack2: !prevState.ack2 }))

  onSubmitWork = () => {
    console.log('Submit', this.state)
  }

  canSubmit = () => !(this.state.ack1 && this.state.ack2 && this.state.proof)

  render() {
    // TODO: replace with props
    const account = 'accplaceholder'

    const { title, repo, number, url } = this.props.issue

    return (
      <Form
        onSubmit={this.onSubmitWork}
        submitText="Submit Work"
        noSeparator
        submitDisabled={this.canSubmit()}
      >
        <Text>{title}</Text>
        
        <SafeLink
          href={url}
          target="_blank"
          style={{ textDecoration: 'none', color: '#21AAE7' }}
        >
          <IssueLinkRow>
            <IconGitHub color="#21AAE7" width='14px' height='14px' />
            <Text style={{ marginLeft: '6px'}}>{repo} #{number}</Text>
          </IssueLinkRow>
        </SafeLink>

        <FormField
          label="Proof of Work"
          required
          input={
            <TextInput.Multiline
              name='proof'
              rows={3}
              style={{ resize: 'none', height: 'auto' }}
              onChange={this.changeField}
              placeholder="Please link the Github Pull Request or an alternative proof of work if requested."
              wide
            />
          }
        />
        <FormField
          label="Additional Comments"
          input={
            <TextInput.Multiline
              name='comments'
              rows={5}
              style={{ resize: 'none', height: 'auto' }}
              onChange={this.changeField}
              placeholder="Do you have any other comments or details you would like to provide that hasn’t already been described elsewhere?"
              wide
            />
          }
        />

        <FormField
          label="Hours Worked"
          input={
            <TextInput.Number
              name='hours'
              value={this.state.hours}
              onChange={this.changeField}
            />
          }
        />

        <AckRow>
          <div style={{width: '23px'}}>
            <CheckButton checked={this.state.ack1} onChange={this.setAck1}/>
          </div>
          <AckText>
            I acknowledge that that my work must be accepted for me to receive the payout.
          </AckText>
        </AckRow>

        <AckRow>
          <div style={{width: '23px'}}>
            <CheckButton checked={this.state.ack2} onChange={this.setAck2}/>
          </div>
          <AckText>
            I am reporting my hours honestly. I understand that this is for informational purposes only and it will be used to optimize pricing of future tasks.
          </AckText>
        </AckRow>

        <Info.Alert title="Submission note" background="#FFFAEE" style={{ marginBottom: '10px' }}>
          Your inputs will be added as a comment to the Github issue from your “{account}” account.
        </Info.Alert>
      </Form>
    )
  }
}

const AckText = styled(Text)`
  color: ${theme.textSecondary};
  margin-left: 6px;
`
const AckRow = styled.div`
  display: flex;
  margin-bottom: 8px;
`
const IssueLinkRow = styled.div`
  height: 31px;
  display: flex;
  align-items: center;
`

export default SubmitWork
