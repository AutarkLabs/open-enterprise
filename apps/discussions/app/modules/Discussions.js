import React, { useState, useEffect, createContext } from 'react'
import PropTypes from 'prop-types'
import DiscussionsApi from './DiscussionsApi'

export const DiscussionsContext = createContext({})

/*
Hacking state together until i figure out how to understand when the api is synced

*/

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
    }

    if (!hasInit) {
      // initDiscussions()
      setHasInit(true)
    }
  })
  return (
    <DiscussionsContext.Provider value={{ discussions, discussionApi }}>
      <button
        onClick={async () => {
          const api = new DiscussionsApi(app)
          await api.init()
          const discussionData = await api.collect()
          setDiscussions(discussionData)
          setDiscussionApi(api)
        }}
      >
        Sync discussion data
      </button>
      {children}
    </DiscussionsContext.Provider>
  )
}

Discussions.propTypes = {
  children: PropTypes.node.isRequired,
  app: PropTypes.object.isRequired,
  ready: PropTypes.bool.isRequired,
}

export default Discussions
