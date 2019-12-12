import { useEffect, useState } from 'react'

/*
 * A function that tells us when it's safe to start loading discussion
 * data from the aragon/api
 * */

export default () => {
  const [handshakeOccured, setHandshakeOccured] = useState(false)
  const handleWrapperMessage = ({ data }) => setHandshakeOccured(true)
  useEffect(() => {
    return window.addEventListener('message', handleWrapperMessage)
  }, [])
  return { handshakeOccured }
}
