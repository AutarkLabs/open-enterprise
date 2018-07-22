import React from 'react'
import styled from 'styled-components'
import { Button, Info, TextInput, Field } from '@aragon/ui'

const initialState = {
  question: '',
  candidate1: 'c1',
}

class NewVotePanelContent extends React.Component {
  static defaultProps = {
    onCreateVote: () => {},
  }
  state = {
    ...initialState,
  }
  UNSAFE_componentWillReceiveProps({ opened }) {
    if (opened && !this.props.opened) {
      // setTimeout is needed as a small hack to wait until the input's on
      // screen until we call focus
      this.questionInput && setTimeout(() => this.questionInput.focus(), 0)
    } else if (!opened && this.props.opened) {
      // Finished closing the panel, so reset its state
      this.setState({ ...initialState })
    }
  }
  handleQuestionChange = event => {
    this.setState({ question: event.target.value })
  }
  handleSubmit = event => {
    event.preventDefault()
    this.props.onCreateVote(this.state.question.trim())
  }
  render() {
    const { question, candidate1, candidate2 } = this.state
    return (
      <div>
        <Info.Action title="RV info (placeholder)">
          Information about range votes (placeholder)
        </Info.Action>
        <Form onSubmit={this.handleSubmit}>
          <Field label="Question">
            <TextInput
              innerRef={question => (this.questionInput = question)}
              value={question}
              onChange={this.handleQuestionChange}
              required
              wide
            />
          </Field>
          <Field label="Candidates">
	    <TextInput
              innerRef={candidate1 => (this.candidate1Input = candidate1)}
              value={candidate1}
              onChange={this.handleCandidate1Change}
              required
              wide
	    />
	    <TextInput
              innerRef={candidate2 => (this.candidate2Input = candidate2)}
              value={candidate2}
              onChange={this.handleCandidate2Change}
              required
              wide
	    />
	  </Field>
          <Button mode="strong" type="submit" wide>
            Begin Vote
          </Button>
        </Form>
      </div>
    )
  }
}

const Form = styled.form`
  margin-top: 20px;
`

// const Warning = styled(Text.Paragraph).attrs({
//   size: 'xsmall',
// })`
//   margin-top: 10px;
// `

export default NewVotePanelContent
