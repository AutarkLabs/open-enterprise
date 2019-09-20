import React from 'react'
import {
  DataView,
  IconCheck,
  IconCross,
  IdentityBadge,
  ProgressBar,
  useTheme
} from '@aragon/ui'
import { BigNumber } from 'bignumber.js'
import PropTypes from 'prop-types'

import { STATUSES } from '../../utils/constants'
import { displayCurrency } from '../../utils/helpers'

const AllocationsHistory = ({ allocations }) => {
  const theme = useTheme()
  return (
    <DataView
      mode="adaptive"
      tableRowHeight={92}
      heading={
        <div>
          Allocations history
        </div>
      }
      fields={[
        'Date',
        'Budget',
        { label: 'Recipients', childStart: true },
        'Description',
        'Status',
        'Amount'
      ]}
      entries={allocations}
      renderEntry={({
        date,
        budget,
        recipients,
        description,
        status,
        amount,
        token
      }, index) => {
        return [
          new Date(Number(date)).toLocaleDateString(),
          budget,
          recipients.length === 1 ? '1 entity'
            : recipients.length + ' entities',
          description,
          <Status key={index} code={status} />,
          <div
            key={index}
            css={{
              color: theme.negative,
              fontWeight: 600,
            }}>
            { displayCurrency(BigNumber(amount)) } { token }
          </div>
        ]
      }}
      renderEntryExpansion={({ recipients, amount, token }) => {
        return recipients.map((recipient, index) => {
          const allocated = BigNumber(recipient.amount).div(amount)
          return (
            <div key={index} css={{
              display: 'flex',
              flexDirection: 'column',
            }}>
              <IdentityBadge
                entity={recipient.address}
                shorten={true}
              />
              <div css={{
                marginTop: '7px',
                marginBottom: '4px',
              }}>
                <ProgressBar
                  value={allocated}
                  color={theme.accentEnd}
                />
              </div>
              <div css={{
                color: theme.contentSecondary,
                alignSelf: 'flex-end',
                fontSize: '12px',
              }}>
                { displayCurrency(BigNumber(recipient.amount)) } {' '}
                {token} {' • '}
                { allocated.times(100).dp(0).toNumber() }{'%'}
              </div>
            </div>
          )
        })
      }}
    />
  )
}

AllocationsHistory.propTypes = {
  allocations: PropTypes.arrayOf(PropTypes.object).isRequired,
}

const Status = ({ code }) => {
  const theme = useTheme()
  return (
    <div css={{
      color: code === 0 ? theme.contentSecondary : theme.content,
      display: 'flex',
      alignItems: 'center',
    }}>
      { code === 1 && <IconCross size="medium" color={theme.negative} /> }
      { code > 1 && <IconCheck size="medium" color={theme.positive} /> }
      <div css={{
        paddingTop: '4px'
      }}>
        {STATUSES[code]}
      </div>
    </div>
  )
}

Status.propTypes = {
  code: PropTypes.string.isRequired,
}

export default AllocationsHistory
