import React, { useEffect, useReducer } from 'react'
import PropTypes from 'prop-types'
import { useAragonApi } from '@aragon/api-react'

import { Profile } from '../../../modules/3box-aragon'
import { BoxContext } from '.'
import {
  fetchingProfile,
  fetchedPublicProfile,
  boxReducer,
  initialState,
  fetchedPublicProfileError,
} from '../../stateManagers/box'

const BoxWrapper = ({ children }) => {
  const { api, connectedAccount } = useAragonApi()
  const [boxes, dispatch] = useReducer(boxReducer, initialState)
  useEffect(() => {
    const getBox = async () => {
      if (connectedAccount && api) {
        dispatch(fetchingProfile(connectedAccount))
        try {
          const profile = new Profile(connectedAccount, api)
          const publicProfile = await profile.getPublic()
          dispatch(fetchedPublicProfile(connectedAccount, publicProfile))
        } catch (error) {
          dispatch(fetchedPublicProfileError(connectedAccount, error))
        }
      }
    }

    getBox()
  }, [api, connectedAccount])

  return (
    <BoxContext.Provider value={{ boxes, dispatch }}>
      {children}
    </BoxContext.Provider>
  )
}

BoxWrapper.propTypes = {
  children: PropTypes.node.isRequired,
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
