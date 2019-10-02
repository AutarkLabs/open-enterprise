import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { Checkbox, Text, TextInput, theme, SafeLink } from '@aragon/ui'

import { Form, FormField, DateInput, DescriptionInput } from '../../Form'
import { IconGitHub } from '../../Shared'
import { useAragonApi } from '../../../api-react'
import useGithubAuth from '../../../hooks/useGithubAuth'
import { usePanelManagement } from '..'
import { ipfsAdd } from '../../../utils/ipfs-helpers'
import { toHex } from 'web3-utils'

class RequestAssignment extends React.Component {
  static propTypes = {
    githubCurrentUser: PropTypes.object.isRequired,
    issue: PropTypes.object.isRequired,
    onRequestAssignment: PropTypes.func.isRequired,
  }

  state = {
    workplan: '',
    hours: 0,
    eta: new Date(),
    ack1: false,
    ack2: false,
  }

  changeField = ({ target: { name, value } }) =>
    this.setState({ [name]: value })
  changeDate = eta => this.setState({ eta })
  setAck1 = () => this.setState(prevState => ({ ack1: !prevState.ack1 }))
  setAck2 = () => this.setState(prevState => ({ ack2: !prevState.ack2 }))

  onRequestAssignment = () => {
    let today = new Date()
    this.props.onRequestAssignment(
      {
        ...this.state,
        user: this.props.githubCurrentUser,
        applicationDate: today.toISOString(),
      },
      this.props.issue
    )
  }

  canSubmit = () =>
    !(
      this.state.ack1 &&
      this.state.ack2 &&
      this.state.workplan &&
      !isNaN(this.state.hours) &&
      this.state.hours > 0
    )

  render() {
    const { title, repo, number, url } = this.props.issue

    return (
      <Form
        onSubmit={this.onRequestAssignment}
        submitText="Request Assignment"
        noSeparator
        submitDisabled={this.canSubmit()}
      >
        <IssueTitle>{title}</IssueTitle>
        <SafeLink
          href={url}
          target="_blank"
          style={{ textDecoration: 'none', color: '#21AAE7' }}
        >
          <IssueLinkRow>
            <IconGitHub color="#21AAE7" width="14px" height="14px" />
            <Text style={{ marginLeft: '6px' }}>
              {repo} #{number}
            </Text>
          </IssueLinkRow>
        </SafeLink>

        <FormField
          label="Work Plan"
          required
          input={
            <DescriptionInput
              value={this.state.workplan}
              name="workplan"
              rows="3"
              onChange={this.changeField}
              placeholder="Describe how you plan to accomplish the task and any questions you may have."
            />
          }
        />

        <Estimations>
          <FormField
            label="Estimated Hours"
            input={
              <HoursInput
                name="hours"
                value={this.state.hours}
                onChange={this.changeField}
              />
            }
          />
          <FormField
            label="Estimated Completion"
            input={
              <DateInput
                name="eta"
                value={this.state.eta}
                onChange={this.changeDate}
              />
            }
          />
        </Estimations>
        <VSpace size={1} />
        <AckRow>
          <div style={{ width: '23px' }}>
            <Checkbox checked={this.state.ack1} onChange={this.setAck1} />
          </div>
          <AckText>
            I understand that this is an application and I should wait for
            approval before starting work.
          </AckText>
        </AckRow>

        <AckRow>
          <div style={{ width: '23px' }}>
            <Checkbox checked={this.state.ack2} onChange={this.setAck2} />
          </div>
          <AckText>
            I agree to keep the organization informed of my progress every few
            days.
          </AckText>
        </AckRow>
        <VSpace size={2} />
        {/* Github commenting is not currently implemented
        <Info.Alert title="Submission note" background="#FFFAEE" style={{ marginBottom: '10px' }}>
          Your inputs will be added as a comment to the Github issue from your “{login}” account.
        </Info.Alert>
        */}
      </Form>
    )
  }
}

const onRequestAssignment = ({ closePanel, requestAssignment }) => async (
  state,
  issue
) => {
  closePanel()
  const hash = await ipfsAdd(state)
  requestAssignment(toHex(issue.repoId), issue.number, hash).toPromise()
}

// TODO: move entire component to functional component
// the following was a quick way to allow us to use hooks
const RequestAssignmentWrap = props => {
  const githubCurrentUser = useGithubAuth()
  const { api } = useAragonApi()
  const { closePanel } = usePanelManagement()
  return (
    <RequestAssignment
      githubCurrentUser={githubCurrentUser}
      onRequestAssignment={onRequestAssignment({
        closePanel,
        requestAssignment: api.requestAssignment,
      })}
      {...props}
    />
  )
}

const HoursInput = styled(TextInput.Number)`
  width: 100px;
  height: 32px;
  display: inline-block;
  padding-top: 3px;
`
const Estimations = styled.div`
  display: flex;
  justify-content: space-between;
  align-content: stretch;
`
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
  margin-bottom: 10px;
  cursor: pointer;
`
const IssueTitle = styled(Text)`
  color: #717171;
  font-size: 17px;
  font-weight: 300;
  line-height: 1.5;
`
const VSpace = styled.div`
  height: ${p => (p.size || 1) * 5}px;
`

export default RequestAssignmentWrap
