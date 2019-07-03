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
  useEffect(() => {
    const initDiscussions = async () => {
      const discussionsApi = new DiscussionsApi(app)
      await discussionsApi.init()
      const discussionData = await discussionsApi.collect()
      setDiscussions(discussionData)
    }

    if (!hasInit) {
      // initDiscussions()
      setHasInit(true)
    }
  })
  return (
    <DiscussionsContext.Provider value={{ discussions }}>
      <button
        onClick={async () => {
          const discussionsApi = new DiscussionsApi(app)
          await discussionsApi.init()
          const discussionData = await discussionsApi.collect()
          console.log(discussionData)
          setDiscussions(discussionData)
        }}
      >
        yo
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
