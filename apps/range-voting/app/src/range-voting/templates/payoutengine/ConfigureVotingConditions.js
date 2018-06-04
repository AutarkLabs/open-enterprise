import React from 'react'
import styled from 'styled-components'
import { Field, DropDown } from '@aragon/ui'
import { Main, Content, Title, Subtitle, Hint } from '../../../style'
import { votePermissionItems, voteWeightItems, voteOutcomeItems } from './voting-conditions'
import { lerp } from '../../../utils/math-utils'
import { noop } from '../../../utils/utils'

class ConfigureVotingConditions extends React.Component {
  static defaultProps = {
    warm: false,
    positionProgress: 0,
    onFieldUpdate: noop,
    onSubmit: noop,
    fields: {},
  }
  UNSAFE_componentWillReceiveProps({ positionProgress }) {
    if (
      positionProgress === 0 &&
      positionProgress !== this.props.positionProgress
    ) {
      this.formEl.elements[0].focus()
    }
  }
  handleVotePermissionChange = index => {
     const { onFieldUpdate } = this.props
     onFieldUpdate('votePermission', index)
  }
  handleVoteWeightChange = index => {
     const { onFieldUpdate } = this.props
     onFieldUpdate('voteWeight', index)
  }
  handleVoteOutcomeChange = index => {
     const { onFieldUpdate } = this.props
     onFieldUpdate('voteOutcome', index)
  }
  createChangeHandler(name) {
    return event => {
      const { onFieldUpdate } = this.props
      onFieldUpdate(name, event.target.value)
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
    return (
      <Content>
        <Title>Payout Engine</Title>
        <StepContainer>
          <SubmitForm onSubmit={onSubmit} innerRef={formRef}>
            <Subtitle>
                Choose your voting settings below. You can’t change these later, so pick carefully.
           </Subtitle>
            <Fields>
              <Fields.Field label="Voting Permission">
                <Hint>
                  Which role will have permission to vote
                </Hint>
                <ConditionDropDown
                  items={votePermissionItems}
                  active={fields.votePermission}
                  onChange={handleVotePermissionChange}
                />
              </Fields.Field>
              <Fields.Field label="Voting Weight">
                <Hint>
                  How each vote will be weighted
                </Hint>
                <DropDown
                  items={voteWeightItems}
                  active={fields.voteWeight}
                  onChange={handleVoteWeightChange}
                />
              </Fields.Field>
              <Fields.Field label="Outcome">
                <Hint>
                  If the vote is informative or results in a token transfer
                </Hint>
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

const StepContainer = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  height: 100%;
`
const Fields = styled.div`
  justify-content: center;
  margin-top: 40px;
  width: 80%;
  margin: auto;
`
const ConditionDropDown = styled(DropDown)`
  width: 380px;
  font-size: 37px;
`
Fields.Field = styled(Field)`
  position: relative;
  &:after {
    position: absolute;
    bottom: 6px;
    left: 100px;
    font-size: 14px;
  }
`
export default ConfigureVotingConditions
