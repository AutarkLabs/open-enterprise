import React from 'react'
import PropTypes from 'prop-types'
import { useTheme } from '@aragon/ui'

const CurrencyBox = ({ children }) => {
  const theme = useTheme()
  return (
    <div css={`
      color: ${theme.contentSecondary};
      border: 1px solid ${theme.border};
      border-left-style: none;
      height: 40px;
      display: flex;
      align-items: center;
      padding: 8px 14px 7px;
      font-weight: normal;
      border-radius: 0 4px 4px 0;
    `}>
      {children}
    </div>
  )
}

CurrencyBox.propTypes = {
  children: PropTypes.node.isRequired,
}

export default CurrencyBox
