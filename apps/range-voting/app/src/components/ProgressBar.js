import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Motion, spring } from 'react-motion'
import { Text, theme } from '@aragon/ui'

const ProgressBar = ({ progress, candidateName }) => (
  <Motion defaultStyle={{ progress: 0 }} style={{ progress: spring(progress) }}>
    {({ progress }) => (
      <Main>
        <Text size="xsmall" color={theme.textSecondary}>
	  { candidateName }
	</Text>
        <Base>
          <Progress
            color={theme.accent}
            style={{ width: `${progress * 100}%` }}
          />
          <Text size="xsmall" color={theme.textSecondary}>
            { Math.round (progress * 100) }%
          </Text>
        </Base>
      </Main>
    )}
  </Motion>
)

ProgressBar.defaultProps = {
  progress: 0,
}

ProgressBar.propTypes = {
  // type: PropTypes.oneOf(['positive', 'negative']).isRequired,
  type: PropTypes.oneOf(['positive', 'negative']),
  progress: PropTypes.number,
}

const Main = styled.div`
  width: 100%;
  align-items: center;
`
const Base = styled.div`
  margin-left: 10px;
  width: 100%;
  height: 16px;
  background: #edf3f6;
  border-radius: 2px;
  text-align: right;
  line-height: 14px;
  padding-right: 6px;
`
const Progress = styled.div`
  height: 16px;
  background: ${({ color }) => color};
  border-radius: 2px;
  float: left;
`
export default ProgressBar
