import PropTypes from 'prop-types'
import React from 'react'

const ReviewWork = ({ issues, rate, onSubmit }) => <div>Review Work</div>

ReviewWork.propTypes = {
  /** array of issues to allocate bounties on */
  issues: PropTypes.arrayOf(
    PropTypes.shape({
      id,
      level,
    })
  ),
  /** base rate in pennies */
  rate: PropTypes.number,
  /** callback fn */
  onSubmit: PropTypes.func,
}

export default ReviewWork
