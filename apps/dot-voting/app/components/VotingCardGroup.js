import React from 'react'
import PropTypes from 'prop-types'
import {
  CardLayout,
  GU,
  Tag,
  textStyle,
  unselectable,
  useLayout,
  useTheme,
} from '@aragon/ui'

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
          <Tag limitDigits={4} label={count} size="small" />
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

export default VotingCardGroup
