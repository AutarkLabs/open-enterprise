import React, { Component } from 'react'
import styled from 'styled-components'
// import { GithubConsumer } from "../context";
import { Text, Info, theme, Field, TextInput, Button } from '@aragon/ui'

const Form = styled.form`
  margin-top: 20px;
`

class GithubAuth extends Component {
  state = {
    authToken: null,
    err: '',
  }
  handleTokenChange = event => {
    this.setState({ authToken: event.target.value, err: '' })
  }

  render() {
    const { err, authToken } = this.state
    return (
      <div>
        <Text size="large">
          Sign in with GitHub to start managing your repos with Aragon
        </Text>
        <ul>
          <li>Prioritize your backlog</li>
          <li>Reach consensus on issue valuations</li>
          <li>Allocate bounties to multiple issues</li>
        </ul>
        <Form onSubmit={this.handleLogin}>
          {err && (
            <Info background={theme.negative} title="Error">
              {err}
            </Info>
          )}
          <Field label="Personal Token">
            <TextInput onChange={this.handleTokenChange} required wide />
          </Field>
          <Button mode="strong" type="submit" wide>
            Sign in with GitHub
          </Button>
        </Form>
      </div>
    )
  }
}

export default GithubAuth
