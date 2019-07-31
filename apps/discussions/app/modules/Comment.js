import React, { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { format, formatDistance } from 'date-fns'
import { Card, IdentityBadge, theme } from '@aragon/ui'
import { IconEdit, IconReply, showOnHover } from '../../../../shared/ui'
import CommentForm from './CommentForm'

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
`

const TimeAgo = styled.time.attrs(props => ({
  dateTime: format(props.date, "y-MM-dd'T'hh:mm:ss"),
  children: formatDistance(props.date, new Date(), { addSuffix: true }),
}))`
  color: ${theme.textTertiary};
`

TimeAgo.propTypes = {
  date: PropTypes.instanceOf(Date).isRequired,
}

const Top = ({ author, createdAt }) => {
  const created = new Date(Number(createdAt) * 1000)
  return (
    <Header>
      <IdentityBadge entity={author} />
      <TimeAgo date={created} />
    </Header>
  )
}

const CommentCard = styled(Card).attrs({
  width: '100%',
  height: 'auto',
})`
  margin-top: 15px;
  margin-bottom: 15px;
  padding: 15px 20px 10px;
`

const Footer = styled.footer`
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
`

const Actions = styled(showOnHover(CommentCard))`
  line-height: 0;
`

const Button = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  outline: none;
  padding: 0;
  :hover,
  :focus {
    color: ${theme.accent};
    path {
      fill: ${theme.accent};
    }
  }
`

const Bottom = ({ author, currentUser, onEdit, onReply }) => (
  <Footer>
    <div>
      {author === currentUser && (
        <Actions>
          <Button onClick={onEdit}>
            <IconEdit height={22} />
          </Button>
        </Actions>
      )}
    </div>
    <Button onClick={onReply}>
      <IconReply alt="" height={16} />
      &nbsp; Reply
    </Button>
  </Footer>
)

const Comment = ({
  currentUser,
  comment: { author, id, text, createdAt, revisions, postCid },
  onReply,
  onSave,
}) => {
  const [editing, setEditing] = useState(false)

  if (editing) {
    const update = async updated => {
      await onSave({ id, text: updated.text, revisions, postCid })
      setEditing(false)
    }

    return (
      <CommentCard>
        <CommentForm
          defaultValue={text}
          onCancel={() => setEditing(false)}
          onSave={update}
        />
      </CommentCard>
    )
  }

  return (
    <CommentCard>
      <Top author={author} createdAt={createdAt} />
      {text}
      <Bottom
        author={author}
        currentUser={currentUser}
        onEdit={() => setEditing(true)}
        onReply={onReply}
      />
    </CommentCard>
  )
}

Comment.propTypes = {
  currentUser: PropTypes.string.isRequired,
  comment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
  }).isRequired,
  onReply: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
}

export default Comment
