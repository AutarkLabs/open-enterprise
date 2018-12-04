import PropTypes from 'prop-types'
import React from 'react'

const NewBountyAllocation = ({ issues, rate, onSubmit }) => (
  <div>New Bounty Allocation</div>
)

NewBountyAllocation.propTypes = {
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

export default NewBountyAllocation
