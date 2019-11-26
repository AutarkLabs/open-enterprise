import { useEffect, useState } from 'react'

export default () => {
  const [handshakeOccured, setHandshakeOccured] = useState(false)

  const handleWrapperMessage = () => setHandshakeOccured(true)
  useEffect(() => {
    return window.addEventListener('message', handleWrapperMessage)
  }, [])
  return { handshakeOccured }
}
