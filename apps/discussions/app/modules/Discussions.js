import React, { useState, useEffect, createContext } from 'react'
import PropTypes from 'prop-types'
import DiscussionsApi from './DiscussionsApi'
import useHandshake from './useHandshake'

export const DiscussionsContext = createContext({})

const Discussions = ({ children, aragonApi }) => {
  const [hasInit, setHasInit] = useState(false)
  const [discussions, setDiscussions] = useState({})
  const [discussionsApi, setDiscussionsApi] = useState({})
  const { handshakeOccured } = useHandshake()

  useEffect(() => {
    const initDiscussions = async () => {
      const api = new DiscussionsApi(aragonApi)
      await api.init()
      const discussionData = await api.collect()
      setDiscussions(discussionData)
      setDiscussionsApi(api)
      setHasInit(true)

      api.listenForUpdates(setDiscussions)
    }
    if (!hasInit && handshakeOccured) {
      initDiscussions()
    }
  }, [hasInit, handshakeOccured])
  return (
    <DiscussionsContext.Provider
      value={{ discussions, discussionsApi, api: aragonApi }}
    >
      {children}
    </DiscussionsContext.Provider>
  )
}

Discussions.propTypes = {
  children: PropTypes.node.isRequired,
  aragonApi: PropTypes.object,
}

export default Discussions
