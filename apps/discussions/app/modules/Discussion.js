import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Box, GU, useTheme } from '@aragon/ui'
import { IdentityProvider } from './LocalIdentityBadge/IdentityManager'
import { useDiscussion } from './'
import Comment from './Comment'
import CommentForm from './CommentForm'

const CommentsBox = styled(Box)`
  margin: ${3 * GU}px 0;
  > div {
    padding: 0;
    > div > div:not(:last-child) {
      border-bottom: 1px solid ${({theme}) => theme.border};
    }
  }
`
const Discussion = ({ discussionId, ethereumAddress, className }) => {
  const theme = useTheme()
  const { discussion, discussionsApi, api } = useDiscussion(discussionId)

  const save = ({ text, id, revisions, postCid }) =>
    id
      ? discussionsApi.revise(
          text,
          discussionId,
          id,
          postCid,
          revisions,
          ethereumAddress
        )
      : discussionsApi.post(text, discussionId, ethereumAddress)

  const hide = ({ id }) => () => discussionsApi.hide(id, discussionId)

  const handleResolveLocalIdentity = useCallback(address => {
    return api.resolveAddressIdentity(address).toPromise()
  }, [api])

  const handleShowLocalIdentityModal = useCallback(address => {
    return api
      .requestAddressIdentityModification(address)
      .toPromise()
  }, [api])

  // aragon wrapper currently places a question mark "help" icon at the bottom
  // right of the page, which overlaps the form submit buttons, given its current
  // location in the sidebar. If either of these factors change later, we may be
  // able to remove this 40px spacer.
  return (
    <div className={className} css="margin-bottom: 40px">
      <IdentityProvider
        onResolve={handleResolveLocalIdentity}
        onShowLocalIdentityModal={handleShowLocalIdentityModal}
      >
        {discussion.length > 0 && (
          <CommentsBox heading='Comments' theme={theme}>
            {discussion.map(comment => (
              <Comment
                comment={comment}
                currentUser={ethereumAddress}
                key={comment.id}
                onDelete={hide(comment)}
                onSave={save}
              />
            ))}
          </CommentsBox>
        )}
        <CommentForm onSave={save} />
      </IdentityProvider>
    </div>
  )
}

Discussion.propTypes = {
  discussionId: PropTypes.number.isRequired,
  ethereumAddress: PropTypes.string.isRequired,
  className: PropTypes.string,
}

export default Discussion
