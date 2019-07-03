import React from 'react'
import PropTypes from 'prop-types'

const DiscussionPost = ({ author, text, createdAt, onRevise, onHide }) => {
  return <div>{text}</div>
}

DiscussionPost.propTypes = {
  author: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  onRevise: PropTypes.func.isRequired,
  onHide: PropTypes.func.isRequired,
}

export default DiscussionPost
