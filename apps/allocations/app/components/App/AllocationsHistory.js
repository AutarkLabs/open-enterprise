import React from 'react'
import {
  DataView,
  IconCheck,
  IconCross,
  IdentityBadge,
  ProgressBar,
  Text,
  useTheme,
} from '@aragon/ui'
import { BigNumber } from 'bignumber.js'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { STATUSES } from '../../utils/constants'
import { displayCurrency } from '../../utils/helpers'

const AllocationsHistory = ({ allocations }) => {
  const theme = useTheme()
  return (
    <DataView
      mode="adaptive"
      tableRowHeight={92}
      heading={
        <Text size="xlarge">Allocations history</Text>
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
          <Amount key={index} theme={theme} >
            { displayCurrency(BigNumber(amount)) } { currency }
          </Amount>
        ]
      }}
      renderEntryExpansion={({ recipients, amount, token }) => {
        return recipients.map((recipient, index) => {
          const allocated = BigNumber(recipient.amount).div(amount)
          return (
            <Recipient key={index}>
              <IdentityBadge
                entity={recipient.address}
                shorten={true}
              />
              <RecipientProgress>
                <ProgressBar
                  value={allocated.toNumber()}
                  color={String(theme.accentEnd)}
                />
              </RecipientProgress>
              <RecipientAmount theme={theme}>
                { displayCurrency(BigNumber(recipient.amount)) } {' '}
                {token} {' • '}
                { allocated.times(100).dp(0).toNumber() }{'%'}
              </RecipientAmount>
            </Recipient>
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
    <StatusContent theme={theme} code={code}>
      { code === 1 && <IconCross size="medium" color={theme.negative} /> }
      { code > 1 && <IconCheck size="medium" color={theme.positive} /> }
      <StatusText>
        {STATUSES[code]}
      </StatusText>
    </StatusContent>
  )
}

Status.propTypes = {
  code: PropTypes.number.isRequired,
}

const Amount = styled.div`
  color: ${({ theme }) => theme.negative};
  font-weight: 600;
`

const Recipient = styled.div`
  display: flex;
  flex-direction: column;
`

const RecipientProgress = styled.div`
  margin-top: 7px;
  margin-bottom: 4px;
`

const RecipientAmount = styled.div`
  color: ${({ theme }) => theme.contentSecondary};
  align-self: flex-end;
  font-size: 12px;
`

const StatusContent = styled.div`
  color: ${({ code, theme }) => code === 0 ?
    theme.contentSecondary : theme.content};
  display: flex;
  align-items: center;
`

const StatusText = styled.div`
  padding-top: 4px;
`

export default AllocationsHistory
