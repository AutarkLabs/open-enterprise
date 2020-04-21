import React from 'react'
import PropTypes from 'prop-types'
import { GU, Tag } from '@aragon/ui'

const getTag = (source) => {
  if (source === '3box') return '3Box'
  if (source === 'addressBook') return 'Address Book'
  return 'Custom Label'
}

function LocalLabelPopoverTitle({ label, source = null }) {
  return (
    <div
      css={`
        display: grid;
        align-items: center;
        grid-template-columns: auto 1fr;
      `}
    >
      <span
        css={`
          display: inline-block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        `}
      >
        {label}
      </span>
      <Tag
        mode="identifier"
        style={{
          marginLeft: `${2 * GU}px`
        }}
      >
        {getTag(source)}
      </Tag>
    </div>
  )
}
LocalLabelPopoverTitle.propTypes = {
  label: PropTypes.string.isRequired,
  source: PropTypes.string,
}

export default LocalLabelPopoverTitle
