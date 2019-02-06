import PropTypes from 'prop-types'
import React from 'react'

const ReviewApplication = ({ issues, rate, onSubmit }) => (
  <div>ReviewApplication</div>
)

ReviewApplication.propTypes = {
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

export default ReviewApplication
