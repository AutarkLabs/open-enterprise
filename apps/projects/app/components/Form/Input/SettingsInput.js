import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Badge, Text, theme } from '@aragon/ui'

import { CheckBox } from '../../Shared'

class SettingsInput extends React.Component {
  static propTypes = {
    // key: PropTypes.number.isRequired, // TODO: Check the use of this required prop
    name: PropTypes.func,
    text: PropTypes.string.isRequired,
  }

  render() {
    return (
      <StyledSettingsInput>
        <CheckBox />
        <Text>{this.props.text}</Text>
        <Badge.Info small>?</Badge.Info>
      </StyledSettingsInput>
    )
  }
}

const StyledSettingsInput = styled.div`
  display: flex;
  padding-top: 10px;
  align-items: center;
  color: ${theme.textTertiary};
  > * {
    margin-right: 0.5rem;
  }
  > :last-child:last-child {
    /* aragon-ui is messing up with the badge styles */
    padding-top: 0;
  }
`

export default SettingsInput
