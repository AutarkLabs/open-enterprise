import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { IdentityBadge, Text, theme } from '@aragon/ui'
import BigNumber from 'bignumber.js'

const issueShape = PropTypes.shape({
  balance: PropTypes.string.isRequired,
  exp: PropTypes.number.isRequired,
  deadline: PropTypes.string.isRequired,
  hours: PropTypes.number.isRequired,
  number: PropTypes.number.isRequired,
  repo: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  workStatus: PropTypes.string.isRequired,
})

const Issue = ({
  balance,
  exp,
  deadline,
  hours,
  number,
  repo,
  title,
  token,
  url,
  workStatus,
}) => (
  <React.Fragment>
    {repo} #{number}
    {title}
    {hours} hours
    {exp}
    {deadline}
    {balance}
  </React.Fragment>
)

Issue.propTypes = issueShape.isRequired

const calcTotalFunding = ({ issues, tokens }) => {
  const balancesByToken = issues.reduce((group, issue) => {
    group[issue.token] = (group[issue.token] || 0) + Number(issue.balance)
    return group
  }, {})

  const totals = Object.keys(balancesByToken).map(tokenAddr => {
    const token = tokens.find(t => t.addr === tokenAddr)

    const total = BigNumber(balancesByToken[tokenAddr])
      .div(BigNumber(10 ** token.decimals))
      .dp(3)
      .toString()

    return `${total} ${token.symbol}`
  })

  return totals
}

const ViewFunding = ({
  fundingProposal: { createdBy, description, issues },
  tokens,
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
      {calcTotalFunding({ issues, tokens }).join(' • ')}
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
  tokens: PropTypes.arrayOf(
    PropTypes.shape({
      addr: PropTypes.string.isRequired,
      decimals: PropTypes.string.isRequired,
      symbol: PropTypes.string.isRequired,
    })
  ).isRequired,
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
`

export default ViewFunding
