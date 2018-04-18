import React from 'react'
import styled from 'styled-components'
import { Text, Field, DropDown, theme } from '@aragon/ui'
import { lerp } from '../../math-utils'
import { noop } from '../../utils'

class ConfigureVotingConditions extends React.Component {
  static defaultProps = {
    warm: false,
    positionProgress: 0,
    onFieldUpdate: noop,
    onSubmit: noop,
    fields: {},
  }
  constructor(props) {
    super(props)
    this.handleVotePermissionChange = this.createChangeHandler('votePermission')
    this.handleVoteWeightChange = this.createChangeHandler('voteWeight')
    this.handleVoteOutcomeChange = this.createChangeHandler('voteOutcome')
  }
  componentWillReceiveProps({ positionProgress }) {
    if (
      positionProgress === 0 &&
      positionProgress !== this.props.positionProgress
    ) {
      this.formEl.elements[0].focus()
    }
  }
  createChangeHandler(name) {
    return event => {
console.log('event ' + name + ': ' + event.target.value)
      const { onFieldUpdate, screen } = this.props
      onFieldUpdate(screen, name, event.target.value)
    }
  }
  handleSubmit = event => {
    event.preventDefault()
    this.formEl.elements[0].blur()
    this.props.onSubmit()
  }
  handleFormRef = el => {
    this.formEl = el
  }
  render() {
    const { positionProgress, warm, fields } = this.props
    return (
      <Main
        style={{
          opacity: 1 - Math.abs(positionProgress),
          transform: `translateX(${lerp(positionProgress, 0, 50)}%)`,
          willChange: warm ? 'opacity, transform' : 'auto',
        }}
      >
        <ConfigureVotingConditionsContent
          fields={fields}
          handleVotePermissionChange={this.handleVotePermissionChange}
          handleVoteWeightChange={this.handleVoteWeightChange}
          handleVoteOutcomeChange={this.handleVoteOutcomeChange}
          onSubmit={this.handleSubmit}
          formRef={this.handleFormRef}
        />
      </Main>
    )
  }
}

class ConfigureVotingConditionsContent extends React.PureComponent {
  render() {
    const {
      fields,
      handleVotePermissionChange,
      handleVoteWeightChange,
      handleVoteOutcomeChange,
      onSubmit,
      formRef,
    } = this.props
    const votePermissionItems=[
      'Project Owners'
    ]
    const voteWeightItems=[
      'Each voter has equal weight'
    ]
    const voteOutcomeItems=[
      'Transfer tokens upon execution'
    ]

    return (
      <Content>
        <Title>Payout Engine</Title>
        <StepContainer>
          <SubmitForm onSubmit={onSubmit} innerRef={formRef}>
            <p style={{ textAlign: 'center' }}>
              <Text size="large" color={theme.textTertiary} align="center">
                Choose your voting settings below. You can’t change these later, so pick carefully.
              </Text>
            </p>
            <Fields>
              <Fields.Field label="Voting Permission">
                <Text size="xsmall" color={theme.textTertiary} align="center">
                  Which role will have permission to vote
                </Text>
                <ConditionDropDown
                  items={votePermissionItems}
                  active={fields.votePermission}
                  onChange={handleVotePermissionChange}
                />
              </Fields.Field>
              <Fields.Field label="Voting Weight">
                <Text size="xsmall" color={theme.textTertiary} align="center">
                  How each vote will be weighted
                </Text>
                <DropDown
                  items={voteWeightItems}
                  active={fields.voteWeight}
                  onChange={handleVoteWeightChange}
                />
              </Fields.Field>
              <Fields.Field label="Outcome">
                <Text size="xsmall" color={theme.textTertiary} align="center">
                  If the vote is informative or results in a token transfer
                </Text>
                <DropDown
                  items={voteOutcomeItems}
                  active={fields.voteOutcome}
                  onChange={handleVoteOutcomeChange}
                />
              </Fields.Field>
            </Fields>
          </SubmitForm>
        </StepContainer>
      </Content>
    )
  }
}

const SubmitForm = ({ children, innerRef = noop, ...props }) => (
  <form {...props} ref={innerRef}>
    {children}
    <input type="submit" style={{ display: 'none' }} />
  </form>
)

const Main = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 100px;
  padding-top: 140px;
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const Title = styled.h1`
  text-align: center;
  font-size: 37px;
  margin-bottom: 40px;
`

const StepContainer = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  height: 100%;
`

const Fields = styled.div`
  margin-top: 40px;
`

const ConditionDropDown = styled(DropDown)`
  width: 380px;
  font-size: 37px;
`

Fields.Field = styled(Field)`
  width: 80%;
  position: relative;
`
export default ConfigureVotingConditions
