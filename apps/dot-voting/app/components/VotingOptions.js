import React from 'react'
import { Spring, config as springs } from 'react-spring'
import VotingOption from './VotingOption'
import { safeDiv } from '../utils/math-utils'
import PropTypes from 'prop-types'

const ANIM_DELAY_MIN = 100
const ANIM_DELAY_MAX = 800

class VotingOptions extends React.Component {
  static defaultProps = {
    options: [],
    voteWeights: [],
    // animationDelay can also be a number to disable the random delay
    animationDelay: { min: ANIM_DELAY_MIN, max: ANIM_DELAY_MAX },
  }

  static propTypes = {
    options: PropTypes.arrayOf(PropTypes.object).isRequired,
    totalSupport: PropTypes.number.isRequired,
    color: PropTypes.string.isRequired,
    voteWeights: PropTypes.arrayOf(PropTypes.string).isRequired,
    animationDelay: PropTypes.object.isRequired,
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
    const { options, totalSupport, color, voteWeights } = this.props

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
            {({ value }) => (
              <VotingOption
                valueSpring={value}
                percentage={safeDiv(parseInt(option.value, 10), totalSupport)*100}
                color={color}
                userVote={voteWeights.length ? Math.round(voteWeights[i]) : -1}
                {...option}
              />
            )}
          </Spring>
        )}
      </React.Fragment>
    )
  }
}

export default VotingOptions
