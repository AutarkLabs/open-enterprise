import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Motion, spring } from 'react-motion'
import { Text, theme } from '@aragon/ui'

const ProgressBar = ({ progress, label }) => (
  <Motion defaultStyle={{ progress: 0 }} style={{ progress: spring(progress) }}>
    {({ progress }) => (
      <Main>
        <Label size="xsmall" color={theme.textSecondary}>
          {label}
        </Label>
        <Base>
          <Progress
            color={theme.accent}
            style={{ width: `${progress * 100}%` }}
          />
        </Base>
      </Main>
    )}
  </Motion>
)

const Main = styled.div`
  width: 100%;
  align-items: center;
`

const Label = styled(Text)`
  overflow: hidden;
  line-height: 1.6em;
  text-overflow: ellipsis;
  margin-bottom: 0.2rem;
`
const Base = styled.div`
  width: 100%;
  height: 8px;
  background-color: ${theme.contentBackgroundActive};
  border-radius: 2px;
  text-align: right;
  line-height: 14px;
  margin-bottom: 12px;
`
const Progress = styled.div`
  height: 8px;
  background: ${({ color }) => color};
  border-radius: 2px;
  float: left;
`
export default ProgressBar
