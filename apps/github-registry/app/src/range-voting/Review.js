import React from 'react'
import styled from 'styled-components'
import { theme, Text } from '@aragon/ui'
import { Main, Content } from '../style'

class Review extends React.Component {
  static defaultProps = {
    warm: false,
    positionProgress: 0,
  }
  render() {
    const { positionProgress, warm, configurationData } = this.props
    if (configurationData === null) {
      return null
    }

   return (
      <Main
        style={{
          opacity: 1 - Math.abs(positionProgress),
          willChange: warm ? 'opacity' : 'auto',
        }}
      >
        <Content>
          <ScrollWrapper>
            <Label>Name</Label>
            <Text>{configurationData.voteName}</Text>

            <Label>Description</Label>
            <Text>{configurationData.voteDescription}</Text>

            <Label>Voting Permission</Label>
            <Text>{configurationData.votePermissionText}</Text>

            <Label>Voting Weight</Label>
            <Text>{configurationData.voteWeightText}</Text>

            <Label>Voting Outcome</Label>
            <Text>{configurationData.voteOutcomeText}</Text>

            <Label>Support</Label>
            <Text>{configurationData.supportNeeded}%</Text>

            <Label>Min. Quorum</Label>
            <Text>{configurationData.minAcceptanceQuorum}%</Text>

            <Label>Vote Duration</Label>
            <Text>{configurationData.voteDuration}</Text>

          </ScrollWrapper>
        </Content>
      </Main>
    )
  }
}

const ScrollWrapper = styled.div`
  width: 600px;
  height: 100%;
  overflow: auto;
  border: 1px solid ${theme.contentBorder};
  padding: 10px;
`
const Label = styled.div`
  font-size: 11px;
  font-weight: 200;
  text-transform: uppercase;
  color: ${theme.textTertiary};
  margin-top: 8px;
`
export default Review

