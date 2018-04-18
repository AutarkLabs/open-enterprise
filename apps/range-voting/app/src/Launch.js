import React from 'react'
import styled from 'styled-components'
import { theme, Text } from '@aragon/ui'
import { noop } from './utils'

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

const Main = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 100px;
  padding-top: 140px;
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

export default Launch

