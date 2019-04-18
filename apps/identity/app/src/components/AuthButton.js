import React, { useContext } from 'react'
import styled from 'styled-components'
import { useAragonApi } from '@aragon/api-react'

import { Button } from '@aragon/ui'

import { BoxContext } from '../wrappers/box'
import { Profile } from '../../modules/3box-aragon'
import {
  requestedProfileUnlock,
  profileUnlockSuccess,
  profileUnlockFailure,
  requestProfileEdit,
} from '../stateManagers/box'

const getButtonTitle = ({
  unlockedProfSuccess,
  loadedPublicProfSuccess,
  editingProfile,
}) => {
  if (editingProfile) return 'Save Profile'
  if (unlockedProfSuccess) return 'Edit Profile'
  if (loadedPublicProfSuccess) return 'Log In'
}

const unlockOrCreateProfile = async (connectedAccount, dispatch, api) => {
  dispatch(requestedProfileUnlock(connectedAccount))
  try {
    const profile = new Profile(connectedAccount, api)
    await profile.unlockOrCreate()
    dispatch(profileUnlockSuccess(connectedAccount, profile))
  } catch (error) {
    dispatch(profileUnlockFailure(connectedAccount, error))
  }
}

const editProfile = (connectedAccount, dispatch) =>
  dispatch(requestProfileEdit(connectedAccount))

const getButtonClickHandler = ({
  unlockedProfSuccess,
  loadedPublicProfSuccess,
  editingProfile,
}) => {
  if (editingProfile) return () => console.log('SAVE YOUR PROFILE')
  if (unlockedProfSuccess) return editProfile
  if (loadedPublicProfSuccess) return unlockOrCreateProfile
  return () => {
    throw new Error('Error thrown in the click handler, unmanaged state')
  }
}

const AuthButton = () => {
  const { boxes, dispatch } = useContext(BoxContext)
  const { api, connectedAccount } = useAragonApi()

  const buttonDisabled = !boxes[connectedAccount]
  const buttonTitle = buttonDisabled
    ? 'Log In'
    : getButtonTitle(boxes[connectedAccount])

  const buttonClickHandler = buttonDisabled
    ? () => {}
    : getButtonClickHandler(boxes[connectedAccount])

  return (
    <StyledButton
      disabled={buttonDisabled}
      mode="strong"
      onClick={() => buttonClickHandler(connectedAccount, dispatch, api)}
    >
      {buttonTitle}
    </StyledButton>
  )
}

const StyledButton = styled(Button)`
  position: absolute;
  top: 10px;
  right: 30px;
  z-index: 2;
`

export default AuthButton
