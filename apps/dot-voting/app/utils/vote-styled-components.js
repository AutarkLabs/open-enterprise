import React from 'react'
import PropTypes from 'prop-types'
import iconAllocations from '../assets/iconAllocations.svg'
import iconProjects from '../assets/iconProjects.svg'
import iconDotVoting from '../assets/iconDotVoting.svg'

const badgeDetails = {
  'allocation': { text: 'Allocations', icon: iconAllocations },
  'curation': { text: 'Issue Curation', icon: iconProjects },
  'informational': { text: 'Informational', icon: iconDotVoting },
}

export const GenerateBadge = ({ type }) => (
  <div css={`
    display: inline-flex;
    font-weight: 300;
    border-radius: 4px;
    font-size: 16px;
    line-height: 1.5;
    white-space: nowrap;
    color: #30404F;
    background-color: rgb(12,196,230,0.09);
  `}>
    <img src={badgeDetails[type].icon} alt="" />
    <span css="margin: 0 10px; padding-top: 3px; height: 24px">{badgeDetails[type].text}</span>
  </div>
)

GenerateBadge.propTypes = {
  type: PropTypes.string.isRequired,
}
