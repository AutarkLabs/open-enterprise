import React from 'react'
import styled from 'styled-components'
import { Field, TextInput } from '@aragon/ui'
import { Main, Content, Title, Subtitle, Hint } from '../../../style'
import { lerp } from '../../../utils/math-utils'
import { noop } from '../../../utils/utils'

class ConfigureVotingName extends React.Component {
  static defaultProps = {
    warm: false,
    positionProgress: 0,
    onFieldUpdate: noop,
    onSubmit: noop,
    fields: {},
  }
  constructor(props) {
    super(props)
    this.handleNameChange = this.createChangeHandler('voteName')
    this.handleDescriptionChange = this.createChangeHandler('voteDescription')
  }
  UNSAFE_componentWillReceiveProps({ positionProgress }) {
    if (
      positionProgress === 0 &&
      positionProgress !== this.props.positionProgress
    ) {
      this.formEl.elements[0].focus()
    }
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
        <ConfigureVotingNameContent
          fields={fields}
          handleNameChange={this.handleNameChange}
          handleDescriptionChange={this.handleDescriptionChange}
          onSubmit={this.handleSubmit}
          formRef={this.handleFormRef}
        />
      </Main>
    )
  }
}

class ConfigureVotingNameContent extends React.PureComponent {
  render() {
    const {
      fields,
      handleNameChange,
      handleDescriptionChange,
      onSubmit,
      formRef,
    } = this.props
    return (
      <Content>
        <Title>Payout Engine</Title>
        <StepContainer>
          <SubmitForm onSubmit={onSubmit} innerRef={formRef}>
            <Subtitle>
              You are creating a custom, reusable multi-option voting app. Enter a name and description so you remember its purpose.
            </Subtitle>
            <Fields>
              <Fields.Field label="Name">
                <Hint>
                  What do you want to name this app?
                </Hint>
                <TextInput
                  placeholder="Name"
                  value={fields.voteName}
                  onChange={handleNameChange}
                />
              </Fields.Field>
              <Fields.Field label="Description">
                <Hint>
                  How would you describe this app?
                </Hint>
                <TextInput.Multiline
                  placeholder="Description"
                  onChange={handleDescriptionChange}
                  value={fields.voteDescription}
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

Fields.Field = styled(Field)`
  position: relative;
  &:after {
    position: absolute;
    bottom: 6px;
    left: 100px;
    font-size: 14px;
  }
`
export default ConfigureVotingName
