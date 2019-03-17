import PropTypes from 'prop-types'
import React from 'react'
import { Toast } from '@aragon/ui'
import iconCopy from '../assets/svg/iconCopy.svg'

const CopyIcon = () => (
  <img src={iconCopy} alt="Copy address to the clipboard" />
)

const ToastCopy = ({ address }) =>
  address ? (
    <Toast>
      {toast => (
        <span
          onClick={() => {
            navigator.clipboard.writeText(address.toLowerCase())
            toast('Address copied')
          }}
          style={{ marginLeft: '.5rem', cursor: 'pointer' }}
        >
          <CopyIcon />
        </span>
      )}
    </Toast>
  ) : null

ToastCopy.propTypes = {
  address: PropTypes.string,
}

export default ToastCopy
