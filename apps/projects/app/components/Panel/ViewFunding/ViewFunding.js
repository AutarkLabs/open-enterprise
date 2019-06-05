import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { Text, theme } from '@aragon/ui'

class ViewFunding extends React.Component {
  static propTypes = {
    fundingProposal: PropTypes.shape({
      description: PropTypes.string.isRequired,
      createdBy: PropTypes.shape({
        avatarUrl: PropTypes.string.isRequired,
        login: PropTypes.string.isRequired,
        url: PropTypes.string.isRequired,
      }).isRequired,
      issues: PropTypes.arrayOf(
        PropTypes.shape({
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
      ).isRequired,
    }),
  }

  render() {
    const { description } = this.props.fundingProposal

    return (
      <React.Fragment>
        <IssueTitle>{description}</IssueTitle>
      </React.Fragment>
    )
  }
}

const IssueTitle = styled(Text)`
  color: ${theme.textSecondary};
  font-size: 17px;
  font-weight: 300;
  line-height: 1.5;
  margin-bottom: 10px;
`

export default ViewFunding
