import React from 'react'
import PropTypes from 'prop-types'
import Markdown from './Markdown'

const DetailHyperText = ({ children }) => {
  return (
    <Markdown
      content={children}
      style={{ marginBottom: '10px' }}
    />
  )
}

DetailHyperText.propTypes = {
  children: PropTypes.node.isRequired,
}

export default DetailHyperText
