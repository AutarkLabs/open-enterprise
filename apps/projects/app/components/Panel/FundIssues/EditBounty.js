import React, { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import BigNumber from 'bignumber.js'
import { useAragonApi } from '../../../api-react'
import { issueShape } from '../../../utils/shapes.js'
import { IconOpen, IconCollapse } from '../../../assets'
import { Box, DropDown, GU, Help, useTheme } from '@aragon/ui'
import { FormField, FieldTitle, DateInput } from '../../Form'
import {
  AmountInput,
  HorizontalInputGroup,
  HoursInput,
  IssueTitleCompact,
  NumericInput,
  TokenInput,
} from './styled'

const DetailsArrow = styled.div`
  width: 24px;
  margin-right: 12px;
`

const Details = styled.div`
  grid-area: deadline;
  background: ${p => p.theme.background};
  border-top: 1px solid ${p => p.theme.border};
  padding: ${2 * GU}px;
  padding-bottom: 0;
  display: ${p => p.detailsOpen ? 'block' : 'none'};
`

const EditBounty = ({
  bounty,
  issue,
  onFocus,
  tokens,
  updateBounty,
}) => {
  const theme = useTheme()
  const [ detailsOpen, setDetailsOpen ] = useState(false)
  const { appState: { bountySettings } } = useAragonApi()

  return (
    <Box key={issue.id} padding={0}>
      <div css={`
        padding: ${2 * GU}px;
        display: flex;
      `}>
        <DetailsArrow onClick={() => setDetailsOpen(!detailsOpen)}>
          {detailsOpen ? <IconCollapse /> : <IconOpen />}
        </DetailsArrow>
        <IssueTitleCompact
          title={issue.title}
          tag={bounty && bounty.hours > 0
            ? BigNumber(bounty.payout).dp(2) + ' ' + bounty.token.symbol
            : ''
          }
        />
      </div>
      <div css={`
              display: grid;
              grid-template-columns: calc(55% - ${GU}px) calc(45% - ${GU}px);
              grid-template-rows: auto;
              grid-template-areas:
                "hours exp"
                ${detailsOpen ? '"deadline deadline"' : ''};
              grid-gap: 12px;
              align-items: stretch;
            `}>

        {bountySettings.fundingModel === 'Fixed' ? (
          <div css={`grid-area: hours; padding-left: ${2 * GU}px`}>
            <FieldTitle>Amount</FieldTitle>
            <HorizontalInputGroup>
              <AmountInput
                name="amount"
                value={bounty.payout}
                onFocus={onFocus}
                onChange={e => updateBounty({ payout: e.target.value })}
                wide
              />
              <TokenInput
                name="token"
                items={tokens.map(t => t.symbol)}
                selected={tokens.indexOf(bounty.token)}
                onChange={i => updateBounty({ token: tokens[i] })}
              />
            </HorizontalInputGroup>
          </div>
        ) : (
          <div css={`grid-area: hours; padding-left: ${2 * GU}px`}>
            <FieldTitle>Estimated Hours</FieldTitle>
            <HoursInput
              name="hours"
              value={bounty.hours}
              onFocus={onFocus}
              onChange={e => updateBounty({ hours: e.target.value })}
              wide
            />
          </div>
        )}

        <div css={`grid-area: exp; padding-right: ${2 * GU}px; width: 100%;`}>
          <FormField
            label="Experience level"
            input={
              <DropDown
                items={bountySettings.expLvls.map(exp => exp.name)}
                onChange={index => updateBounty({ exp: index })}
                selected={bounty.exp}
                wide
              />
            }
          />
        </div>

        <Details theme={theme} detailsOpen={detailsOpen}>
          <FormField
            label="Number of Bounties"
            required
            help={
              <>
              &nbsp;<Help hint="The work terms">
              By default, the issues in this funding proposal will not require
              applications to work on a bounty before work is submitted.
              To require applications, click on the switch to enable this term.
              </Help>
              </>
            }
            input={
              <NumericInput
                step="1"
                min="1"
                type="number"
                name="bounties"
                value={bounty.bounties}
                onChange={e => updateBounty({ bounties: e.target.value })}
                wide
              />
            }
          />
          <FormField
            label="Deadline"
            input={
              <DateInput
                name="deadline"
                value={bounty.deadline}
                onChange={deadline => updateBounty({ deadline })}
                wide
              />
            }
            css="margin-bottom: 0"
          />
        </Details>
      </div>
    </Box>
  )
}

EditBounty.propTypes = {
  bounty: PropTypes.object,
  issue: issueShape,
  onFocus: PropTypes.func,
  tokens: PropTypes.array.isRequired,
  updateBounty: PropTypes.func.isRequired,
}

export default EditBounty
