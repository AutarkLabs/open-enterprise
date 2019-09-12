import React from 'react'
import styled from 'styled-components'
import { Tag, Text } from '@aragon/ui'
import { animated } from 'react-spring'
import PropTypes from 'prop-types'
import { useNetwork } from '../api-react'
import { LocalIdentityBadge } from '../../../../shared/identity'

const VotingOption = ({ valueSpring, label, percentage, color, threshold, userVote, fontSize }) => {
  const network = useNetwork()

  return (
    <Main>
      <Labels>
        {label && (
          <div>
            <LocalIdentityBadge
              compact
              fontSize={fontSize}
              networkType={network.type}
              entity={label}
              shorten
            />
            {userVote !== -1 && (
              <Tag label={`YOU: ${userVote}%`} />
            )}
          </div>
        )}
        {percentage !== -1 &&
            <Text size="xsmall" color="#98A0A2">
              {Math.round(percentage)}%
            </Text>
        }
      </Labels>
      <div css={`
          display: flex;
          align-items: center;
          position: relative;
        `}
      >
        <BarWrapper>
          <Bar
            style={{
              transform: valueSpring.interpolate(v => `scale3d(${v}, 1, 1)`),
              backgroundColor: color,
            }}
          />
        </BarWrapper>
        {threshold !== -1 && <Threshold threshold={threshold} />}
      </div>
    </Main>
  )
}

VotingOption.defaultProps = {
  color: '#95ECFF',
  threshold: -1,
  label: '',
  percentage: -1,
  userVote: -1,
}

VotingOption.propTypes = {
  fontSize: PropTypes.oneOf([ 'xsmall', 'small' ]),
  valueSpring: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  percentage: PropTypes.number.isRequired,
  threshold: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  userVote: PropTypes.number.isRequired,
}

const Main = styled.div`
  & + & {
    margin-top: 10px;
  }
`

const Labels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
`

const BarWrapper = styled.div`
  overflow: hidden;
  background: #edf3f6;
  border-radius: 2px;
  position: relative;
  width: 100%;
`

const Bar = styled(animated.div)`
  width: 100%;
  height: 6px;
  transform-origin: 0 0;
`
const Threshold = styled.div`
  overflow: hidden;
  position: absolute;
  top: -10px;
  left: ${props => props.threshold}%;
  height: 24px;
  width: 30px;
  border-left: 1px dotted #979797;
  z-index: 1000;
`

export default VotingOption
