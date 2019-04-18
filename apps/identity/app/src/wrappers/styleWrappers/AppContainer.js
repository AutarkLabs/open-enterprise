import React from 'react'
import PropTypes from 'prop-types'
import { useAragonApi } from '@aragon/api-react'
import { AppView, AppBar } from '@aragon/ui'

import AuthButton from '../../components/AuthButton'

const AppContainer = ({ children }) => {
  const { connectedAccount } = useAragonApi()
  return (
    <AppView
      appBar={
        <AppBar
          title="Profile"
          endContent={<AuthButton connectedAccount={connectedAccount} />}
        />
      }
    >
      {children}
    </AppView>
  )
}

AppContainer.propTypes = {
  children: PropTypes.node.isRequired,
}

export default AppContainer
