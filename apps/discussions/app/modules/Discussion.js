import React from 'react'
import PropTypes from 'prop-types'
import { useDiscussion } from './'
import Comment from './Comment'
import CommentForm from './CommentForm'

const Discussion = ({ discussionId, ethereumAddress }) => {
  const { discussion, discussionApi } = useDiscussion(discussionId)

  const save = text => discussionApi.post(text, discussionId, ethereumAddress)

  return (
    <div>
      {discussion.map(comment => (
        <Comment key={comment.id} comment={comment} />
      ))}
      <CommentForm save={save} />
    </div>
  )
}

Discussion.propTypes = {
  discussionId: PropTypes.number.isRequired,
  ethereumAddress: PropTypes.string.isRequired,
}

export default Discussion
