import React from 'react'
import PropTypes from 'prop-types'
import { GU, textStyle } from '@aragon/ui'

const Title = ({ question }) => (
  <div
    css={`
      display: grid;
      grid-template-columns: auto;
      grid-gap: ${2.5 * GU}px;
      margin-top: ${2.5 * GU}px;
      margin-bottom: ${2 * GU}px;
    `}
  >
    <div
      css={`
        ${textStyle('title2')};
      `}
    >
      <strong>{question}</strong>
    </div>
  </div>
)

Title.propTypes = {
  question: PropTypes.string.isRequired,
}

export default Title
