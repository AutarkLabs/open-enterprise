import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import InformationPanel from './informationPanel'
import OrganizationPanel from './OrganizationPanel'

const Profile = ({ ethereumAddress }) => {
  return (
    <div>
      <PanelSeparator>
        <InformationPanel ethereumAddress={ethereumAddress} />
        <OrganizationPanel />
      </PanelSeparator>
    </div>
  )
}

Profile.propTypes = {
  ethereumAddress: PropTypes.string.isRequired,
}

const PanelSeparator = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding-left: 50px;
  padding-right: 50px;
  width: 100vw;
`

export default Profile
