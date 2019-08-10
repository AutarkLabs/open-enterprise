import React from 'react'
import { Spring, config as springs } from 'react-spring'
import VotingOption from './VotingOption'
import { safeDiv } from '../utils/math-utils'

const ANIM_DELAY_MIN = 100
const ANIM_DELAY_MAX = 800

class VotingOptions extends React.Component {
  static defaultProps = {
    options: [],

    // animationDelay can also be a number to disable the random delay
    animationDelay: { min: ANIM_DELAY_MIN, max: ANIM_DELAY_MAX },
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
    const { options, totalSupport } = this.props

    return (
      <React.Fragment>
        {options.map((option, i) => (
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
                label={safeDiv(parseInt(option.value, 10), totalSupport)*100}
                percentage={safeDiv(parseInt(option.value, 10), totalSupport)*100}
                {...option}
              />
            )}
          </Spring>
        ))}
      </React.Fragment>
    )
  }
}

export default VotingOptions
