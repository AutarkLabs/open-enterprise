import { useContext } from 'react'
import { getDiscussion, DiscussionsContext } from './'

const useDiscussion = id => {
  const { discussions, discussionApi } = useContext(DiscussionsContext)
  const discussion = getDiscussion(id, discussions)
  return { discussion, discussionApi }
}

export default useDiscussion
