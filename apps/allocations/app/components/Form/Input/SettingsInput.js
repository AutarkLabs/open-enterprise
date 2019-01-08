import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Badge, Text, theme } from '@aragon/ui'

import { CheckBox } from '../../Shared'

class SettingsInput extends React.Component {
  static propTypes = {
    // key: PropTypes.number.isRequired, // TODO: Check the use of this required prop
    name: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
  }
  
  changeChecked = (checked) => {
    const {name} = this.props
    const value = !this.state.checked
    this.setState({checked: value})
    this.props.onChange({ target: { name: name, value: value } })
  }
  state = { checked: false }
  render() {
    return (
      <StyledSettingsInput>
        <CheckBox 
          checked={this.state.checked}
          onChange={this.changeChecked}
        />
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
    padding: 0;
  }
`

export default SettingsInput
