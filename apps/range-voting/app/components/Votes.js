import React from 'react'
import styled from 'styled-components'
import { BadgeNumber, colors, Viewport } from '@aragon/ui'
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
              <span>Open Range Votes</span>
              <BadgeNumber
                background={colors.Rain['Rain Sky']}
                color={colors.Rain.Slate}
                number={openedVotes.length}
                inline
              />
            </Title>
            <Viewport>
              {({ below, width }) => below(TABLE_CARD_BREAKPOINT) ? (
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
              <span>Closed Range Votes</span>
            </Title>
            <Viewport>
              {({ below, width }) => below(TABLE_CARD_BREAKPOINT) ? (
                <VotesList
                  votes={closedVotes}
                  onSelectVote={onSelectVote}
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

        {/* <SeeMoreWrapper>
          <Button mode="secondary">Show Older Range Votes</Button>
        </SeeMoreWrapper> */}
      </React.Fragment>
    )
  }
}

const Title = styled.h1`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  font-weight: 600;
  font-size: 16px;
  & > span:first-child {
    margin-right: 10px;
  }
`

const VotesTableWrapper = styled.div`
  margin-bottom: 30px;
`

// const SeeMoreWrapper = styled.div`
//   display: flex;
//   justify-content: center;
// `

export default Votes
