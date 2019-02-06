import React from 'react'
import styled from 'styled-components'
import { Text, Info, theme, Field, TextInput, Button } from '@aragon/ui'

// TODO: Github icon on the button
// TODO: Fix styles
const GithubAuth = ({ onGithubSignIn = null }) => (
  <React.Fragment>
    <Text size="large" style={{ marginTop: '20px' }}>
      Sign in with GitHub to start managing your repos with Aragon
    </Text>
    <ProjBenefits>
      <li>Prioritize your backlog</li>
      <li>Reach consensus on issue valuations</li>
      <li>Allocate bounties to multiple issues</li>
    </ProjBenefits>
    {/* {err && (
          <Info background={theme.negative} title="Error">
            {err}
          </Info>
        )} */}
    {/* TODO: Maybe add an "advanced" checkbox to
          conditionally show this fo use personal token?:
          */}
    {/* <Field label="Personal Token">
            <TextInput onChange={this.handleTokenChange} required wide />
          </Field> */}
    <Button mode="strong" wide onClick={onGithubSignIn || null}>
      Sign in with GitHub
    </Button>
  </React.Fragment>
)

const ProjBenefits = styled.ul`
  margin: 20px;
`
export default GithubAuth
