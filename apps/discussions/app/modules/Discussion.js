import React, { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Text, theme, Button, TextInput } from '@aragon/ui'
import { useDiscussion } from './'
import DiscussionPost from './DiscussionPost'

const Discussion = ({ discussionId }) => {
  const { discussion } = useDiscussion(discussionId)
  const [post, setPost] = useState('')

  return (
    <div>
      <Label>Discussion</Label>
      {Object.keys(discussion).length === 0 && (
        <p>No comments have been posted yet.</p>
      )}
      {Object.keys(discussion).map(postId => (
        <DiscussionPost {...discussion[postId]} />
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
      <Button mode="strong" wide>
        Post Comment
      </Button>
    </div>
  )
}

Discussion.propTypes = {
  discussionId: PropTypes.number.isRequired,
}

const Label = styled(Text).attrs({
  smallcaps: true,
  color: theme.textSecondary,
})`
  display: block;
  margin-bottom: 10px;
`

export default Discussion
