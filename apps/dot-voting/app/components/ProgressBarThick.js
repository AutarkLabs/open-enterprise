import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Motion, spring } from 'react-motion'
import { Text, theme } from '@aragon/ui'

const ProgressBar = ({ progress, label, hasBalance = false, balanceSplit = '' }) => (
  <Motion defaultStyle={{ progress: 0 }} style={{ progress: spring(progress) }}>
    {({ progress }) => (
      <Main hasBalance={hasBalance} >
        <Label>{label}</Label>
        <Base>
          <Progress
            color={theme.accent}
            style={{ width: `${progress * 100}%` }}
          />
        </Base>
        <Text.Block
          size="xsmall"
          color={theme.textSecondary}
          style={{ paddingRight: '4px', textAlign: 'right' }}
        >
          {balanceSplit} • {Math.round(progress * 100)}%
        </Text.Block>
      </Main>
    )}
  </Motion>
)

ProgressBar.defaultProps = {
  progress: 0,
}

ProgressBar.propTypes = {
  progress: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  hasBalance: PropTypes.bool.isRequired,
  balanceSplit: PropTypes.string.isRequired,
}

const Label = styled.p`
  margin-top: 1rem;
  margin-bottom: 0.2rem;
`

const Main = styled.div`
  display: inline-block;
  width: 100%;
  align-items: center;
`
const Base = styled.div`
  width: 100%;
  height: 20px;
  background-color: ${theme.contentBackgroundActive};
  border-radius: 2px;
  text-align: right;
  margin-bottom: 2px;
  margin-top: 2px;
`
const Progress = styled.div`
  height: 20px;
  background: ${({ color }) => color};
  border-radius: 2px;
  float: left;
`
export default ProgressBar
