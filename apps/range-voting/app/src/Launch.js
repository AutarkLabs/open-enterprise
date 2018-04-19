import React from 'react'
import styled from 'styled-components'
import { theme, Text } from '@aragon/ui'
import { noop } from './utils'
import { Main, Content } from './style'

class Launch extends React.Component {
  static defaultProps = {
    warm: false,
    positionProgress: 0,
    onSelect: noop,
  }
  handleTemplateSelect = template => {
    this.props.onSelect(template)
  }
  render() {
    const { positionProgress, warm, templates, activeTemplate } = this.props
    return (
      <Main
        style={{
          opacity: 1 - Math.abs(positionProgress),
          willChange: warm ? 'opacity' : 'auto',
        }}
        >
        <Content>
this is visible launch component
        </Content>
      </Main>
    )
  }
}

export default Launch

