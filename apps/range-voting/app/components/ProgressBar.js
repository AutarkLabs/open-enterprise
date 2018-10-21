import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Motion, spring } from 'react-motion'
import { Text, theme } from '@aragon/ui'

const ProgressBar = ({ progress, label }) => (
  <Motion defaultStyle={{ progress: 0 }} style={{ progress: spring(progress) }}>
    {({ progress }) => (
      <Main>
        <Text size="xsmall" color={theme.textSecondary}>
          {label}
	</Text>
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

ProgressBar.defaultProps = {
  progress: 0
}

ProgressBar.propTypes = {
  // type: PropTypes.oneOf(['positive', 'negative']).isRequired,
  type: PropTypes.oneOf(['positive', 'negative']),
  progress: PropTypes.number
}

const Main = styled.div`
  width: 100%;
  align-items: center;
`
const Base = styled.div`
  width: 100%;
  height: 6px;
  background-color: #edf3f6;
  border-radius: 2px;
  text-align: right;
  line-height: 14px;
  padding-right: 6px;
`
const Progress = styled.div`
  height: 6px;
  background: ${({ color }) => color};
  border-radius: 2px;
  float: left;
`
export default ProgressBar
