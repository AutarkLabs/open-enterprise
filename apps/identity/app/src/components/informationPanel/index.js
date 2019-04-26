import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import ProfilePicture from './ProfilePicture'
import InformationCard from './InformationCard'

const LeftPanel = ({ ethereumAddress }) => {
  return (
    <AlignCenter>
      <ProfilePicture ethereumAddress={ethereumAddress} />
      <InformationCard ethereumAddress={ethereumAddress} />
    </AlignCenter>
  )
}

LeftPanel.propTypes = {
  ethereumAddress: PropTypes.string.isRequired,
}

const AlignCenter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
  padding-left: 40px;
`

export default LeftPanel
