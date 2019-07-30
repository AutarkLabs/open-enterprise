import React from 'react'
import PropTypes from 'prop-types'
import { useDiscussion } from './'
import Comment from './Comment'
import CommentForm from './CommentForm'

const Discussion = ({ discussionId, ethereumAddress }) => {
  const { discussion, discussionApi } = useDiscussion(discussionId)

  // TODO: add DiscussionsApi function for updating an existing comment
  const save = ({ id, text }) =>
    id
      ? discussionApi.post(text, discussionId, ethereumAddress)
      : discussionApi.post(text, discussionId, ethereumAddress)

  return (
    <div>
      {discussion.map(comment => (
        <Comment comment={comment} key={comment.id} save={save} />
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
