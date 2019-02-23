import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Badge, Checkbox, Text, theme } from '@aragon/ui'

class SettingsInput extends React.Component {
  static propTypes = {
    // key: PropTypes.number.isRequired, // TODO: Check the use of this required prop
    name: PropTypes.func,
    text: PropTypes.string.isRequired,
  }

  render() {
    return (
      <StyledSettingsInput>
        <label>
          <Checkbox />
          <Text>{this.props.text}</Text>
        </label>
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
