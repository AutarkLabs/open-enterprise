import { useContext } from 'react'
import { getDiscussion, DiscussionsContext } from './'

const useDiscussion = id => {
  const { discussions } = useContext(DiscussionsContext)
  const discussion = getDiscussion(id, discussions)
  return { discussion }
}

export default useDiscussion
