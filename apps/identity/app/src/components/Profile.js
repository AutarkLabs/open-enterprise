import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import LeftPanel from './LeftPanel'
import RightPanel from './RightPanel'

const PanelSeparator = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding-left: 50px;
  padding-right: 50px;
  width: 100vw;
`

const Profile = ({ ethereumAddress }) => {
  return (
    <div>
      <PanelSeparator>
        <LeftPanel />
        <RightPanel />
      </PanelSeparator>
    </div>
  )
}

Profile.propTypes = {
  ethereumAddress: PropTypes.string.isRequired,
}

export default Profile
