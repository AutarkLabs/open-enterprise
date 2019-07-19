import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { format, formatDistance } from 'date-fns'
import { Card, IdentityBadge, theme } from '@aragon/ui'

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

const Meta = ({ author, createdAt }) => {
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

const Comment = ({ comment: { author, text, createdAt } }) => (
  <CommentCard>
    <Meta author={author} createdAt={createdAt} />
    {text}
  </CommentCard>
)

Comment.propTypes = {
  comment: PropTypes.shape({
    author: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
  }).isRequired,
}

export default Comment
