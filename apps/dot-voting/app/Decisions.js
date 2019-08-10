import React, { useState }  from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import emptyIcon from './assets/new_dot_vote.svg'
import Votes from './components/Votes'
import tokenBalanceOfAbi from './abi/token-balanceof.json'
import tokenDecimalsAbi from './abi/token-decimals.json'
import tokenSymbolAbi from './abi/token-symbol.json'
import { safeDiv } from './utils/math-utils'
import { isBefore } from 'date-fns'
import { BackButton, Bar, EmptyStateCard, SidePanel, } from '@aragon/ui'
import { VotePanelContent } from './components/Panels'
import { getQuorumProgress, getTotalSupport } from './utils/vote-utils'

const tokenAbi = [].concat(tokenBalanceOfAbi, tokenDecimalsAbi, tokenSymbolAbi)

const EmptyIcon = () => <img src={emptyIcon} alt="" />

const Decisions = ({
  app,
  pctBase,
  minParticipationPct,
  userAccount,
  votes,
  entries,
  voteTime,
  tokenAddress,
}) => {
  const [ currentVoteId, setCurrentVoteId ] = useState(-1)
  const [ now, setNow ] = useState(new Date())

  const getTokenContract = (tokenAddress) => 
    tokenAddress && app.external(tokenAddress, tokenAbi)

  const tokenContract = getTokenContract(tokenAddress)

  //setInterval( () => setNow(new Date(), 1000))
  /*
  UNSAFE_componentWillReceiveProps(nextProps) {
    const { settingsLoaded } = this.state
    // Is this the first time we've loaded the settings?
    if (!settingsLoaded && hasLoadedVoteSettings(nextProps)) {
      this.setState({
        settingsLoaded: true,
      })
    }
    if (nextProps.tokenAddress !== this.props.tokenAddress) {
      this.setState({
        tokenContract: this.getTokenContract(nextProps.tokenAddress),
      })
    }
  }
*/

    
  const handleVoteOpen = voteId => {
    const exists = votes.some(vote => voteId === vote.voteId)
    if (!exists) return
    setCurrentVoteId(voteId)
  }

  const handleVote = (voteId, supports) => {
    app.vote(voteId, supports)
    handleVoteClose()
  }
  const handleVoteClose = () => {
  }
  
  const getAddressLabel = (entries, option) => {
    const index = entries.findIndex(entry => entry.addr === option.label)
    return index > -1 ? entries[index].data.name : option.label
  }

  const handleBackClick = () => setCurrentVoteId(-1)

  const displayVotes = votes.length > 0

  // Add useful properties to the votes
  const preparedVotes = displayVotes
    ? votes.map(vote => {
      const endDate = new Date(vote.data.startDate + voteTime)
      vote.data.options = vote.data.options.map(option => {
        return {
          ...option,
          label: getAddressLabel(entries, option)
        }
      })
      return {
        ...vote,
        endDate,
        open: isBefore(now, endDate),
        quorum: safeDiv(vote.data.minAcceptQuorum, pctBase),
        quorumProgress: getQuorumProgress(vote.data),
        minParticipationPct: minParticipationPct,
        description: vote.data.metadata,
        totalSupport: getTotalSupport(vote.data),
        type: vote.data.type,
      }
    })
    : votes

  const currentVote =
      currentVoteId === -1
        ? null
        : preparedVotes.find(vote => vote.voteId === currentVoteId)

  return (
    <StyledDecisions>
      {
        currentVote !== null ? (
          <React.Fragment>
            <Bar>
              <BackButton onClick={handleBackClick} />
            </Bar>
            <VotePanelContent
              app={app}
              vote={currentVote}
              user={userAccount}
              tokenContract={tokenContract}
              onVote={handleVote}
              minParticipationPct={minParticipationPct}
            />
          </React.Fragment>
        ) : (
          <ScrollWrapper>
            {displayVotes ? (
              <Votes votes={preparedVotes} onSelectVote={handleVoteOpen} app={app}/>
            ) : (
              <div css={`
              display: flex;
              align-atems: center;
              justify-content: center;
              flex-grow: 1;
            `}
              >
                <EmptyStateCard
                  icon={<EmptyIcon />}
                  title="You do not have any dot votes."
                  text="Use the Allocations app to get started."
                  onActivate={() => <div />}
                />
              </div>
            )}
          </ScrollWrapper>
        )}
    </StyledDecisions>
  )
}

Decisions.propTypes = {
  app: PropTypes.object,
  tokenAddress: PropTypes.string.isRequired,
  userAccount: PropTypes.string.isRequired,
  votes: PropTypes.arrayOf(PropTypes.object).isRequired,
  entries: PropTypes.arrayOf(PropTypes.object).isRequired,
  minParticipationPct: PropTypes.number.isRequired,
  pctBase: PropTypes.number.isRequired,
  voteTime: PropTypes.number.isRequired,
}

const ScrollWrapper = styled.div`
  position: relative;
  z-index: 1;
  height: 100%;
  overflow: auto;
`
const StyledDecisions = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  overflow: auto;
  flex-grow: 1;
`

export default Decisions
