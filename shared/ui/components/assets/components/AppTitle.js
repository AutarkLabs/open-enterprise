import { Text } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import { MenuButton } from '.'

const AppTitle = props => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    {props.displayMenuButton ? (
      <React.Fragment>
        <MenuButton style={{ padding: '0 16px', width: 'auto' }} />
        <Text size="xxlarge" style={{ margin: '0' }}>{props.title}</Text>
      </React.Fragment>
    ) : (
      <Text size="xxlarge" style={{ margin: '0 30px' }}>{props.title}</Text>
    )}
  </div>
)

AppTitle.propTypes = {
  title: PropTypes.string.isRequired,
  displayMenuButton: PropTypes.bool.isRequired,
}

export default AppTitle
