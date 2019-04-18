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
} from '../stateManagers/box'

const getButtonTitle = ({ unlockedProfSuccess, loadedPublicProfSuccess }) => {
  if (unlockedProfSuccess) return 'Edit Profile'
  if (loadedPublicProfSuccess) return 'Log In'
}

const unlockOrCreateProfile = async (connectedAccount, api, dispatch) => {
  dispatch(requestedProfileUnlock(connectedAccount))
  try {
    const profile = new Profile(connectedAccount, api)
    await profile.unlockOrCreate()
    dispatch(profileUnlockSuccess(connectedAccount, profile))
  } catch (error) {
    dispatch(profileUnlockFailure(connectedAccount, error))
  }
}

const getButtonClickHandler = ({
  unlockedProfSuccess,
  loadedPublicProfSuccess,
}) => {
  if (unlockedProfSuccess) return () => console.log('EDIT YOUR PROFILE!')
  if (loadedPublicProfSuccess) return unlockOrCreateProfile
  return () => console.log('HI')
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
      onClick={() => buttonClickHandler(connectedAccount, api, dispatch)}
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
