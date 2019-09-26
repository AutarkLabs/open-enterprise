import React from 'react'
import PropTypes from 'prop-types'
import { GU, textStyle } from '@aragon/ui'

const Label = ({ children }) => (
  <div css={`
      ${textStyle('label2')};
      margin-bottom: ${2 * GU}px !important;
    `}
  >
    {children}
  </div>
)

Label.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Label
