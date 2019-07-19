import React from 'react'
import PropTypes from 'prop-types'
import { useDiscussion } from './'
import DiscussionPost from './DiscussionPost'
import CommentForm from './CommentForm'

const Discussion = ({ discussionId, ethereumAddress }) => {
  const { discussion, discussionApi } = useDiscussion(discussionId)

  const save = text => discussionApi.post(text, discussionId, ethereumAddress)

  return (
    <div>
      {discussion.map(post => (
        <DiscussionPost
          onHide={() => {}}
          onRevise={() => {}}
          key={post.id}
          {...post}
        />
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
