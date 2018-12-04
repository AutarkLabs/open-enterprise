import PropTypes from 'prop-types'
import React from 'react'

const SubmitWork = ({ issues, rate, onSubmit }) => <div>Submit Work</div>

SubmitWork.propTypes = {
  /** array of issues to allocate bounties on */
  issues: PropTypes.arrayOf(
    PropTypes.shape({
      id,
      level,
    })
  ),
  /** base rate in pennies */
  rate: PropTypes.number,
  onSubmit: PropTypes.func,
}

export default SubmitWork
