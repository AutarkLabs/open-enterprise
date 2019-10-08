import React, { useCallback, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import { useAragonApi } from './api-react'
import {
  REQUESTED_GITHUB_TOKEN_SUCCESS,
  REQUESTED_GITHUB_TOKEN_FAILURE,
} from './store/eventTypes'

import { CLIENT_ID, getToken, GITHUB_URI, STATUS } from './utils/github'

const GithubSignin = ({ setGithubLoading }) => {
  const { api } = useAragonApi()

  const handleIframeMessage = useCallback(async message => {
    if (!iframeRef.current) return
    console.log(message, iframeRef, message.source === iframeRef)
    if (message.source !== iframeRef) return

    switch (message.data.name) {
    case 'code':
      try {
        const token = await getToken(message.data.code)
        setGithubLoading(false)
        api.emitTrigger(REQUESTED_GITHUB_TOKEN_SUCCESS, {
          status: STATUS.AUTHENTICATED,
          token
        })

      } catch (err) {
        setGithubLoading(false)
        api.emitTrigger(REQUESTED_GITHUB_TOKEN_FAILURE, {
          status: STATUS.FAILED,
          token: null,
        })
      }
      break
    case 'ping':
      // The popup cannot read `window.opener.location` directly because of
      // same-origin policies. Instead, it pings this page, this page pings
      // back, and the location info can be read from that ping.
      iframeRef.current.postMessage({ name: 'ping' }, '*')
    }
  }, [])

  useEffect(() => {
    window.addEventListener('message', handleIframeMessage)
    return () => {
      window.removeEventListener('message', handleIframeMessage)
    }
  })

  const iframeRef = useRef(null)

  return (
    <iframe
      name="GitHubOAuthIFrame"
      title="GitHubOAuthIFrame"
      src={`${GITHUB_URI}?client_id=${CLIENT_ID}&scope=public_repo`}
      frameBorder="0"
      ref={iframeRef}
      sandbox="allow-scripts allow-forms allow-same-origin allow-top-navigation"
      css="height: 100%; width: 100%"
    />
  )
}

GithubSignin.propTypes = {
  setGithubLoading: PropTypes.func.isRequired,
}

export default GithubSignin
