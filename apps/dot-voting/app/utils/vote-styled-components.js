import React from 'react'
import PropTypes from 'prop-types'

export const GenerateBadge = ({ label, iconSrc }) => (
  <div css={`
      display: inline-flex;
      font-weight: 300;
      border-radius: 4px;
      font-size: 16px;
      line-height: 1.5;
      white-space: nowrap;
      color: #30404F;
      background-color: rgb(12,196,230,0.09);
      overflow:hidden;
    `}>
    <img src={iconSrc} alt="" css={`
          height:24px;
          width:24px;
        `}/>
    <span css="margin: 0 10px; padding-top: 3px; height: 24px">{label}</span>
  </div>
)

GenerateBadge.propTypes = {
  label: PropTypes.string.isRequired,
  iconSrc: PropTypes.string.isRequired,
}
