import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Button, TextInput } from '@aragon/ui'
import { useDiscussion } from './'
import DiscussionPost from './DiscussionPost'

const Discussion = ({ discussionId, ethereumAddress }) => {
  const { discussion, discussionApi } = useDiscussion(discussionId)
  const [post, setPost] = useState('')
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
      <TextInput
        css={`
          margin-top: 20px;
          margin-bottom: 20px;
          height: 80px;
          padding: 5px 10px;
        `}
        wide
        value={post}
        onChange={e => setPost(e.target.value)}
      />
      <Button
        mode="strong"
        wide
        onClick={async () => {
          await discussionApi.post(post, discussionId, ethereumAddress)
          setPost('')
        }}
      >
        Post Comment
      </Button>
    </div>
  )
}

Discussion.propTypes = {
  discussionId: PropTypes.number.isRequired,
  ethereumAddress: PropTypes.string.isRequired,
}

export default Discussion
