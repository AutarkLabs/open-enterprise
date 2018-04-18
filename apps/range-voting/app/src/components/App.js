import React from 'react'
import {AragonApp, AppBar} from '@aragon/ui'
import LoginButton from './LoginButton'

class App extends React.Component {
  render () {
    return (
      <AragonApp backgroundLogo={true}>
        <AppBar title="Range Voting" endContent={<LoginButton />}/>
      </AragonApp>
    )
  }
}

export default App;
