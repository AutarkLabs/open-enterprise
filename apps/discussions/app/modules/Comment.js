import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { format, formatDistance } from 'date-fns'
import { Card, IdentityBadge, theme } from '@aragon/ui'
import { IconEdit, IconReply, showOnHover } from '../../../../shared/ui'

const CURRENT_USER = '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'

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

const Bottom = ({ author }) => (
  <Footer>
    <div>
      {author === CURRENT_USER && (
        <Actions>
          <Button onClick={() => console.log('edit')}>
            <IconEdit height={22} />
          </Button>
        </Actions>
      )}
    </div>
    <Button onClick={() => console.log('reply')}>
      <IconReply alt="" height={16} />
      &nbsp; Reply
    </Button>
  </Footer>
)

const Comment = ({ comment: { author, text, createdAt } }) => (
  <CommentCard>
    <Top author={author} createdAt={createdAt} />
    {text}
    <Bottom author={author} />
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
