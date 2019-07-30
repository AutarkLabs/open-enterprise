import React, { useState, useEffect, createContext } from 'react'
import PropTypes from 'prop-types'
import DiscussionsApi from './DiscussionsApi'

export const DiscussionsContext = createContext({})

const Discussions = ({ children, app, ready }) => {
  const [hasInit, setHasInit] = useState(false)
  const [discussions, setDiscussions] = useState({})
  const [discussionApi, setDiscussionApi] = useState({})

  useEffect(() => {
    const initDiscussions = async () => {
      const api = new DiscussionsApi(app)
      await api.init()
      const discussionData = await api.collect()
      setDiscussions(discussionData)
      setDiscussionApi(api)
      setHasInit(true)

      api.listenForUpdates(discussionData, setDiscussions)
    }

    if (!hasInit && ready) {
      initDiscussions()
    }
  }, [ready])
  return (
    <DiscussionsContext.Provider value={{ discussions, discussionApi }}>
      {children}
    </DiscussionsContext.Provider>
  )
}

Discussions.propTypes = {
  children: PropTypes.node.isRequired,
  app: PropTypes.object,
  ready: PropTypes.bool.isRequired,
}

export default Discussions
