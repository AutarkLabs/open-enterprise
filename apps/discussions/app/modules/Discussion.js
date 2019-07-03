import React from 'react'
import PropTypes from 'prop-types'
import { useDiscussion } from './'

const Discussion = ({ discussionId }) => {
  const { discussion } = useDiscussion(discussionId)

  console.log(discussion)
  return <div>Yo!!!</div>
}

Discussion.propTypes = {
  discussionId: PropTypes.number.isRequired,
}

export default Discussion
