import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useDiscussion } from './'
import Comment from './Comment'
import CommentForm from './CommentForm'

const Discussion = ({ discussionId, ethereumAddress }) => {
  const { discussion, discussionApi } = useDiscussion(discussionId)
  const [replyText, setReplyText] = useState('')

  // TODO: add DiscussionsApi function for updating an existing comment
  const save = ({ id, text }) =>
    id
      ? discussionApi.post(text, discussionId, ethereumAddress)
      : discussionApi.post(text, discussionId, ethereumAddress)

  const reply = comment => () => setReplyText(`${comment.author} `)
  const cancelReply = () => setReplyText('')

  // aragon wrapper currently places a question mark "help" icon at the bottom
  // right of the page, which overlaps the form submit buttons, given its current
  // location in the sidebar. If either of these factors change later, we may be
  // able to remove this 40px spacer.
  return (
    <div css="margin-bottom: 40px">
      {discussion.map(comment => (
        <Comment
          comment={comment}
          key={comment.id}
          onSave={save}
          onReply={reply(comment)}
        />
      ))}
      <CommentForm
        onSave={save}
        defaultValue={replyText}
        onCancel={replyText && cancelReply}
      />
    </div>
  )
}

Discussion.propTypes = {
  discussionId: PropTypes.number.isRequired,
  ethereumAddress: PropTypes.string.isRequired,
}

export default Discussion
