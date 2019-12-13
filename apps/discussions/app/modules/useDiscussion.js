import { useContext } from 'react'
import { getDiscussion, DiscussionsContext } from './'

const useDiscussion = id => {
  const { app, discussions, discussionApi } = useContext(DiscussionsContext)
  const discussionObj = getDiscussion(id, discussions)
  const discussionArr = Object.keys(discussionObj)
    .sort((a, b) => discussionObj[a].createdAt - discussionObj[b].createdAt)
    .map(postId => ({ ...discussionObj[postId], id: postId }))
  return { app, discussion: discussionArr, discussionApi }
}

export default useDiscussion
