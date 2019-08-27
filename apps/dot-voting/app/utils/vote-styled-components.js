import React from 'react'
import PropTypes from 'prop-types'
import {
  Badge,
} from '@aragon/ui'

const badgeDetails = {
  'allocation': { fg: '#AF499AFF', bg: '#AF499A33', text: 'Allocation' },
  'curation': { fg: '#4B5EBFFF', bg: '#4B5EBF33', text: 'Issue Curation' },
  'informational': { fg: '#C1B95BFF', bg: '#C1B95B33', text: 'Informational' },
}

export const GenerateBadge = ({ type }) => (
  <Badge.App foreground={badgeDetails[type].fg} background={badgeDetails[type].bg}>
    {badgeDetails[type].text}
  </Badge.App>
)

GenerateBadge.propTypes = {
  type: PropTypes.string.isRequired,
}