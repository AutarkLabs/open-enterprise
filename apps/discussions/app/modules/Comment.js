import React, { useState, useEffect, Fragment } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { format, formatDistance } from 'date-fns'
import { GU, useTheme } from '@aragon/ui'
import LocalIdentityBadge from './LocalIdentityBadge/LocalIdentityBadge'
import { IconEdit, IconDelete, Markdown } from '../../../../shared/ui'
import CommentForm from './CommentForm'

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  width: 100%;
`

const TimeAgo = styled.time.attrs(props => ({
  dateTime: format(props.date, "y-MM-dd'T'hh:mm:ss"),
  children: formatDistance(props.date, new Date(), { addSuffix: true }),
}))`
  color: ${({theme}) => theme.contentSecondary};
`

TimeAgo.propTypes = {
  date: PropTypes.instanceOf(Date).isRequired,
}

const Top = ({ author, createdAt }) => {
  const theme = useTheme()
  const created = new Date(Number(createdAt) * 1000)
  return (
    <Header>
      <LocalIdentityBadge entity={author}/>
      <TimeAgo date={created} theme={theme}/>
    </Header>
  )
}

const CommentDiv = styled.div`
  padding: ${2 * GU}px;
  position: relative;
`

const Footer = styled.footer`
  opacity: 0;
  position: absolute;
  right: 20px;
  bottom: 10px;
  :focus-within,
  ${CommentDiv}:hover & {
    opacity: 1;
  }
`

const Button = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  line-height: 0;
  outline: none;
  padding: 0;
  vertical-align: middle;
`

const Edit = styled(Button)`
  :hover,
  :focus {
    color: ${({theme}) => theme.accent};
    path {
      fill: ${({theme}) => theme.accent};
    }
  }
`

const Delete = styled(Button)`
  :active,
  :hover,
  :focus {
    color: ${({theme}) => theme.negative};
    path {
      fill: ${({theme}) => theme.negative};
    }
  }
  // hack to make the svg flush with the right edge of CommentDiv
  ${Edit} + & {
    margin-right: -5px;
  }
`

const Bottom = ({ onDelete, onEdit }) => {
  const theme = useTheme()
  const [deleting, setDeleting] = useState(false)

  return (
    <Footer>
      {!deleting && (
        <Edit
          theme={theme}
          onClick={onEdit}
        >
          <IconEdit height={22} />
        </Edit>
      )}
      <Delete
        aria-live="polite"
        theme={theme}
        onBlur={() => setDeleting(false)}
        onClick={deleting ? onDelete : () => setDeleting(true)}
      >
        {deleting ? 'Confirm delete' : <IconDelete height={22} />}
      </Delete>
    </Footer>
  )
}

const Comment = ({
  currentUser,
  comment: { author, id, text, createdAt, revisions, postCid },
  onDelete,
  onSave,
}) => {
  const [editing, setEditing] = useState(false)

  const update = async updated => {
    await onSave({ id, text: updated.text, revisions, postCid })
    setEditing(false)
  }

  return (
    <CommentDiv>
      {editing ? (
        <CommentForm
          defaultValue={text}
          onCancel={() => setEditing(false)}
          onSave={update}
        />
      ) : (
        <Fragment>
          <Top author={author} createdAt={createdAt} />
          <Markdown content={text} />
          {author === currentUser && (
            <Bottom onDelete={onDelete} onEdit={() => setEditing(true)} />
          )}
        </Fragment>
      )}
    </CommentDiv>
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
  onDelete: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
}

export default Comment
