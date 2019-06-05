import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { Text, theme } from '@aragon/ui'

class ViewFunding extends React.Component {
  static propTypes = {
    issue: PropTypes.shape({
      title: PropTypes.string.isRequired,
    }).isRequired,
  }

  render() {
    const { issue } = this.props

    console.log({ component: 'ViewFunding', issue })

    return (
      <React.Fragment>
        <IssueTitle>{issue.title}</IssueTitle>
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
