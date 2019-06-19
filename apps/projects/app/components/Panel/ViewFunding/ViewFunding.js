import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { IdentityBadge, Text, theme } from '@aragon/ui'
import BigNumber from 'bignumber.js'

import Issue, { issueShape, Dot } from './Issue'

const calcTotalFunding = issues => {
  const totalsByToken = issues.reduce((group, issue) => {
    group[issue.tokenSymbol] = group[issue.tokenSymbol] || {
      total: 0,
      symbol: issue.tokenSymbol,
    }
    group[issue.tokenSymbol].total = issue.balance.plus(
      group[issue.tokenSymbol].total
    )
    return group
  }, {})

  return Object.values(totalsByToken).map(
    ({ total, symbol }) => `${total.dp(3).toString()} ${symbol}`
  )
}

const ViewFunding = ({
  fundingProposal: { createdBy, description, issues },
}) => (
  <Grid>
    <Half>
      <Label>Created By</Label>
      <IdentityBadge entity={createdBy.login} />
    </Half>
    <Half>
      <Label>Status</Label>
      {issues[0].workStatus}
    </Half>
    <Full>
      <Label>Description</Label>
      {description}
    </Full>
    <Half>
      <Label>Total Funding</Label>
      {calcTotalFunding(issues).join(<Dot />)}
    </Half>
    <Half>
      <Label>Total Issues</Label>
      {issues.length}
    </Half>
    {issues.map(issue => (
      <Full key={issue.number}>
        <Issue key={issue.number} {...issue} />
      </Full>
    ))}
  </Grid>
)

ViewFunding.propTypes = {
  fundingProposal: PropTypes.shape({
    description: PropTypes.string.isRequired,
    createdBy: PropTypes.shape({
      avatarUrl: PropTypes.string.isRequired,
      login: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
    }).isRequired,
    issues: PropTypes.arrayOf(issueShape).isRequired,
  }),
}

const Grid = styled.div`
  background: ${theme.contentBorder};
  display: grid;
  grid-gap: 1px;
  grid-template-columns: 50% 50%;
  margin: 0 -30px;
  padding-top: 1px;
  > * {
    background: white;
    padding: 30px;
  }
`
const Half = styled.div`
  grid-column: span 1;
`
const Full = styled.div`
  grid-column: span 2;
`
const Label = styled(Text.Block).attrs({
  size: 'small',
  color: theme.textTertiary,
})`
  margin-bottom: 15px;
  text-transform: uppercase;
  white-space: nowrap;
`

export default ViewFunding
