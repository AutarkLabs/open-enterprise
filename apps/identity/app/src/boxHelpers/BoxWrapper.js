import React, { useEffect, useReducer } from 'react'
import PropTypes from 'prop-types'

import { Profile } from '../../modules/3box-aragon'
import { boxReducer, initialState, BoxContext } from './'
import { fetchingProfile, fetchedPublicProfile } from './actions'

const BoxWrapper = ({ children, api, connectedAccount }) => {
  const [boxState, dispatch] = useReducer(boxReducer, initialState)
  useEffect(() => {
    const getBox = async () => {
      if (connectedAccount && api) {
        dispatch(fetchingProfile(connectedAccount))
        const profile = new Profile(connectedAccount, api)
        const publicProfile = await profile.getPublic()
        dispatch(fetchedPublicProfile(connectedAccount, publicProfile))
      }
    }

    getBox()
  }, [api, connectedAccount])

  return (
    <BoxContext.Provider value={{ boxState, dispatch }}>
      {children}
    </BoxContext.Provider>
  )
}

BoxWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  api: PropTypes.object,
  connectedAccount: PropTypes.string,
}

export default BoxWrapper

/*
helpful functions
  const profile = new Profile(connectedAccount, api)
  await profile.unlockOrCreate()
  const privateData = await profile.getPrivate()
  console.log('PRIVATE DATA', privateData)
  const set = await profile.setPublicFields(['cool'], ['guy'])
  console.log(set)
  const publicProfile = await profile.getPublic()
  console.log('PUBLIC PROFILE', publicProfile)
*/
