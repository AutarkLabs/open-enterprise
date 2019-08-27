import React from 'react'
import PropTypes from 'prop-types'
import { Spring, config as springs } from 'react-spring'
import { Box, Text, useTheme } from '@aragon/ui'
import VotingOption from '../VotingOption'

const Participation = ({ vote }) => {
  const theme = useTheme()
  return (
    <Box heading="Participation">
      <div css="margin-bottom: 10px">
        {Math.round(vote.data.participationPct)}%{' '}
        <Text size="small" color={`${theme.surfaceContentSecondary}`}>
          ({vote.minParticipationPct}% needed)
        </Text>
      </div>

      <Spring
        delay={500}
        config={springs.stiff}
        from={{ value: 0 }}
        to={{ value: vote.data.participationPct / 100 }}
        native
      >
        {({ value }) => (
          <VotingOption
            valueSpring={value}
            color={`${theme.positive}`}
            value={value}
            threshold={vote.minParticipationPct}
          />
        )}
      </Spring>
    </Box>
  )
}

Participation.propTypes = {
  vote: PropTypes.shape({
    data: PropTypes.shape({
      participationPct: PropTypes.number.isRequired,
    }),
    minParticipationPct: PropTypes.number.isRequired,
  }).isRequired,
}

export default Participation
