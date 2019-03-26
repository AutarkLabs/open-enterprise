import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Text, theme, Viewport, Badge } from '@aragon/ui'
import { FieldTitle } from '../Form'



const PayoutsTable = props => {
  const Narrow = props.belowMedium
  const Wide = props.aboveMedium

  return (
    <div>
      <Text.Block size="large" weight="bold">
        Payouts
      </Text.Block>

      <Viewport>
        {({ below, }) =>
          below('medium') ? (
            <Narrow {...props} />
          ) : (
            <Wide {...props} />
          )
        }
      </Viewport>
    </div>
  )
}

PayoutsTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  belowMedium: PropTypes.func.isRequired,
  aboveMedium: PropTypes.func.isRequired,
}

const PayoutDescription = styled(Text.Block)`
  display: block;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${theme.textPrimary};
`

const NarrowList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid ${theme.contentBorder};
  border-radius: 3px;
  > :not(:last-child) {
    border-bottom: 1px solid ${theme.contentBorder};
  }
`
const NarrowListPayout = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 10px;
`
const AmountBadge = styled(Badge).attrs({
  background: '#D1D1D1',
  foreground: theme.textPrimary,
})`
  padding: 10px;
  margin: 20px;
  text-size: large;
`
export { PayoutDescription, PayoutsTable, NarrowList, NarrowListPayout, AmountBadge }
