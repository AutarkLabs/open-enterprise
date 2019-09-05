import React from 'react'
import PropTypes from 'prop-types'
import {
  CardLayout,
  GU,
  textStyle,
  unselectable,
  useLayout,
  useTheme,
} from '@aragon/ui'
import styled from 'styled-components'

const VotingCardGroup = ({ title, count, children }) => {
  const theme = useTheme()
  const { layoutName } = useLayout()
  const compactMode = layoutName === 'small'
  const rowHeight = compactMode ? null : 350

  return (
    <section>
      <h2
        css={`
          display: flex;
          align-items: center;
          ${unselectable};
          margin-bottom: ${3 * GU}px;
          ${compactMode ? `padding: 0 ${2 * GU}px;` : ''}
        `}
      >
        <div
          css={`
            ${textStyle(compactMode ? 'body2' : 'body3')};
            color: ${theme.content};
          `}
        >
          {title}
        </div>
        <span
          css={`
            margin-left: ${1.5 * GU}px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: ${theme.info};
            ${textStyle('label3')};
          `}
        >
          <DiscTag>
            {count > 9999 ? '9999+' : count}
          </DiscTag>
        </span>
      </h2>
      <CardLayout columnWidthMin={30 * GU} rowHeight={rowHeight}>
        {children}
      </CardLayout>
    </section>
  )
}

VotingCardGroup.propTypes = {
  title: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  children: PropTypes.node.isRequired,
}

const DiscTag = styled.span`
  display: inline-flex;
  white-space: nowrap;
  color: rgb(109, 128, 136);
  padding-top: 4px;
  letter-spacing: -0.5px;
  /* stylelint-disable-next-line property-no-vendor-prefix */
  -webkit-box-pack: center;
  justify-content: center;
  /* stylelint-disable-next-line property-no-vendor-prefix */
  -webkit-box-align: center;
  align-items: center;
  width: 18px;
  height: 18px;
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  background: rgb(220, 234, 239);
  overflow: hidden;
  border-radius: 9px;
`

export default VotingCardGroup
