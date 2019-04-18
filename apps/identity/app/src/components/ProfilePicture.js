import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const Circle = styled.div`
  border-radius: 50%;
  width: 150px;
  height: 150px;
  background: silver;
  border: 3px;
  position: relative;
  top: 30px;
`

const ProfilePicture = () => {
  return <Circle />
}

ProfilePicture.propTypes = {}

export default ProfilePicture
