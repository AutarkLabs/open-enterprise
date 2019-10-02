import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { Button, IdentityBadge, Info, Text } from '@aragon/ui'

import {
  ONE_TIME_DIVIDEND,
  RECURRING_DIVIDEND,
  ONE_TIME_MERIT,
  OTHER,
} from '../../utils/constants'

const RewardSummary = ({ reward, theme, onCancel, onSubmit }) => {
  const {
    description,
    rewardType,
    referenceAsset,
    customToken,
    amount,
    amountToken,
    dateReference,
    dateStart,
    dateEnd,
    disbursements,
  } = reward
  return (
    <VerticalContainer>
      <VerticalSpace />
      <GreyBox theme={theme}>
        <Title>{description}</Title>
        <SubTitle theme={theme}>{rewardType}</SubTitle>
        <Heading theme={theme}>Reference Asset</Heading>
        <Content>
          {referenceAsset === OTHER ? (
            <IdentityBadge
              badgeOnly
              entity={customToken.address}
              shorten
            />
          ): referenceAsset}
        </Content>
        <Heading theme={theme}>
          {rewardType === ONE_TIME_MERIT && 'Total'}
          {' Amount '}
          {rewardType === RECURRING_DIVIDEND && 'per Cycle'}
        </Heading>
        <Content>{amount} {amountToken.symbol}</Content>
        <Heading theme={theme}>
          {rewardType === ONE_TIME_MERIT ?
            'Start and End Date' : 'Disbursement Date'}
          {rewardType === RECURRING_DIVIDEND && 's'}
        </Heading>
        {rewardType === ONE_TIME_DIVIDEND && (
          <Content>{dateReference.toDateString()}</Content>
        )}
        {rewardType === RECURRING_DIVIDEND &&
         disbursements.map((disbursement, i) => (
           <Content key={i}>
             {disbursement.toDateString()}
           </Content>
         ))}
        {rewardType === ONE_TIME_MERIT && (
          <Content>
            {dateStart.toDateString()}{' - '}{dateEnd.toDateString()}
          </Content>
        )}
      </GreyBox>
      <VerticalSpace />
      <Info>
        {'Holding the reference asset at the disbursement date'}
        {rewardType === 'RECURRING_DIVIDEND' && 's'}
        {' will issue a proportionally split reward across all token holders.'}
      </Info>
      <VerticalSpace />
      { onCancel && onSubmit && (
        <HorizontalContainer>
          <Button
            label="Go back"
            mode="normal"
            css={{ fontWeight: 700, marginRight: '4px' }}
            onClick={onCancel}
            wide
          />
          <Button
            label="Submit"
            mode="strong"
            css={{ fontWeight: 700, marginLeft: '4px' }}
            wide
            onClick={onSubmit}
          />
        </HorizontalContainer>
      )}
    </VerticalContainer>
  )
}

RewardSummary.propTypes = {
  reward: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func,
}

const VerticalContainer = styled.div`
  display: flex;
  flex-direction: column;
`
const HorizontalContainer = styled.div`
  display: flex;
  justify-content: space-between;
`
const VerticalSpace = styled.div`
  height: 24px;
`
const GreyBox = styled.div`
  background-color: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};
  padding: 24px;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
`
const Title = styled(Text).attrs({
  size: 'xlarge',
})``
const SubTitle = styled(Text).attrs({
  size: 'xsmall',
})`
  color: ${({ theme }) => theme.contentSecondary};
  margin-bottom: 8px;
`
const Heading = styled(Text).attrs({
  smallcaps: true,
})`
  color: ${({ theme }) => theme.contentSecondary};
  margin-top: 16px;
  margin-bottom: 8px;
`
const Content = styled(Text).attrs({})``

export default RewardSummary
