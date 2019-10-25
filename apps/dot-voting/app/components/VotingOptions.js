import React from 'react'
import { Spring, config as springs } from 'react-spring'
import VotingOption from './VotingOption'
import { safeDiv } from '../utils/math-utils'
import PropTypes from 'prop-types'
import { BigNumber } from 'bignumber.js'

const ANIM_DELAY_MIN = 100
const ANIM_DELAY_MAX = 800

class VotingOptions extends React.Component {
  static defaultProps = {
    options: [],
    voteWeights: [],
    balance: 0,
    symbol: '',
    // animationDelay can also be a number to disable the random delay
    animationDelay: { min: ANIM_DELAY_MIN, max: ANIM_DELAY_MAX },
    displayYouBadge: false,
  }

  static propTypes = {
    fontSize: PropTypes.oneOf([ 'xsmall', 'small' ]),
    options: PropTypes.arrayOf(PropTypes.object).isRequired,
    totalSupport: PropTypes.number.isRequired,
    color: PropTypes.string.isRequired,
    voteWeights: PropTypes.arrayOf(PropTypes.string).isRequired,
    balance: PropTypes.number,
    symbol: PropTypes.string,
    animationDelay: PropTypes.object.isRequired,
    displayYouBadge: PropTypes.bool,
  }

  constructor(props) {
    super(props)
    const { animationDelay } = props

    const delay = Number.isInteger(animationDelay)
      ? animationDelay
      : animationDelay.min +
        Math.random() * (animationDelay.max - animationDelay.min)

    this.state = { delay }
  }

  render() {
    const { delay } = this.state
    const { options, totalSupport, color, voteWeights, balance, symbol, displayYouBadge } = this.props
    return (
      <React.Fragment>
        {options.map((option, i) =>
          <Spring
            key={i}
            delay={delay}
            config={springs.stiff}
            from={{ value: 0 }}
            to={{ value: safeDiv(parseInt(option.value, 10), totalSupport) }}
            native
          >
            {({ value }) => {
              const percentage = safeDiv(parseInt(option.value, 10), totalSupport)
              const allocation = symbol ? `${BigNumber(balance).times(percentage).toString()} ${symbol}` : ''
              return (
                <VotingOption
                  fontSize={this.props.fontSize}
                  valueSpring={value}
                  percentage={percentage*100}
                  allocation={allocation}
                  color={color}
                  userVote={(voteWeights.length && displayYouBadge) ? Math.round(voteWeights[i]) : -1}
                  {...option}
                />
              )}
            }
          </Spring>
        )}
      </React.Fragment>
    )
  }
}

export default VotingOptions
