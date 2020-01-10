import React from 'react'
import PropTypes from 'prop-types'
import { Box, Button, GU, Text, textStyle, useTheme } from '@aragon/ui'
import noResultsSvg from '../assets/no-results.svg'

function EmptyFilteredVotes({ onClear }) {
  const theme = useTheme()

  return (
    <Box>
      <div
        css={`
          margin-top: ${4 * GU}px;
          display: flex;
          flex-direction: column;
          align-items: center;
        `}
      >
        <img
          css={`
            margin: ${4 * GU}px 0;
            height: 176px;
          `}
          src={noResultsSvg}
          alt="No results"
        />
        <Text css={`${textStyle('title2')}`} color={`${theme.content}`}>
          No results found.
        </Text>
        <div
          css={`
            max-width: 270px;
            text-align: center;
            margin-bottom: ${4 * GU}px;
            color: ${theme.surfaceContentSecondary};
            ${textStyle('body2')}
          `}
        >
          We can’t find any item matching your search query.{' '}
          <Button
            css={`
              color: ${theme.link};
              border: none;
              background: none;
              border-radius: 0;
              box-shadow: none;
              padding: 0;
              min-width: unset;
              height: auto;
              &:hover {
                border: none;
                box-shadow: none;
              }
            `}
            onClick={onClear}
          >
            Clear search
          </Button>
        </div>
      </div>
    </Box>
  )
}

EmptyFilteredVotes.propTypes = {
  onClear: PropTypes.func.isRequired,
}

export default React.memo(EmptyFilteredVotes)
