import React from 'react'
import styled from 'styled-components'
import { Viewport, Badge } from '@aragon/ui'
import VotesTable from '../components/VotesTable'
import VotesList from '../components/VotesList'

const TABLE_CARD_BREAKPOINT = 710

class Votes extends React.Component {
  render() {
    const { votes, onSelectVote, app } = this.props
    const openedVotes = votes.filter(({ open }) => open)
    const closedVotes = votes.filter(vote => !openedVotes.includes(vote))
    return (
      <React.Fragment>
        {openedVotes.length > 0 && (
          <VotesTableWrapper>
            <Title>
              <span>Open Dot Votes</span>{' '}
              <Badge.Info>{openedVotes.length}</Badge.Info>
            </Title>
            <Viewport>
              {({ below }) => below(TABLE_CARD_BREAKPOINT) ? (
                <VotesList
                  votes={openedVotes}
                  onSelectVote={onSelectVote}
                />
              ) : (
                <VotesTable
                  opened
                  votes={openedVotes}
                  onSelectVote={onSelectVote}
                />
              )}
            </Viewport>
          </VotesTableWrapper>
        )}

        {closedVotes.length > 0 && (
          <VotesTableWrapper>
            <Title>
              <span>Closed Dot Votes</span>{' '}
              <Badge.Info>{closedVotes.length}</Badge.Info>
            </Title>
            <Viewport>
              {({ below }) => below(TABLE_CARD_BREAKPOINT) ? (
                <VotesList
                  votes={closedVotes}
                  onSelectVote={onSelectVote}
                  app={app}
                />
              ) : (
                <VotesTable
                  opened={false}
                  votes={closedVotes}
                  onSelectVote={onSelectVote}
                  app={app}
                />
              )}
            </Viewport>
          </VotesTableWrapper>
        )}
      </React.Fragment>
    )
  }
}

const Title = styled.h1`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 600;
  font-size: 16px;
  & > span:first-child {
    margin-right: 10px;
  }
`

const VotesTableWrapper = styled.div`
  margin-bottom: 30px;
`

export default Votes
