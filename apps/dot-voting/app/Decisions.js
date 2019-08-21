import React, { useCallback, useEffect, useState }  from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import emptyStatePng from './assets/voting-empty-state.png'
import Votes from './components/Votes'
import tokenBalanceOfAbi from './abi/token-balanceof.json'
import tokenDecimalsAbi from './abi/token-decimals.json'
import tokenSymbolAbi from './abi/token-symbol.json'
import { safeDiv } from './utils/math-utils'
import { isBefore } from 'date-fns'
import { BackButton, Bar, DropDown, EmptyStateCard, GU, textStyle, useLayout, useTheme } from '@aragon/ui'
import VoteDetails from './components/VoteDetails'
import { getQuorumProgress, getTotalSupport } from './utils/vote-utils'
import { getVoteStatus } from './utils/vote-utils'
import EmptyFilteredVotes from './components/EmptyFilteredVotes'
import {
  VOTE_STATUS_EXECUTED,
  VOTE_STATUS_FAILED,
  VOTE_STATUS_SUCCESSFUL,
} from './utils/vote-types'

const useFilterVotes = (votes, voteTime, minParticipationPct) => {
  const [ filteredVotes, setFilteredVotes ] = useState(votes)
  // Status - 0: All, 1: Open, 2: Closed
  const [ statusFilter, setStatusFilter ] = useState(-1)
  // Outcome - 0: All, 1: Passed, 2: Rejected, 3: Enacted, 4: Pending
  const [ outcomeFilter, setOutcomeFilter ] = useState(-1)
  // 0: All, 1: Allocations, 2: Curation, 3: Informational
  const [ appFilter, setAppFilter ] = useState(-1)

  const handleClearFilters = useCallback(() => {
    setStatusFilter(-1)
    setOutcomeFilter(-1)
    setAppFilter(-1)
  }, [
    setStatusFilter,
    setOutcomeFilter,
    setAppFilter,
  ])

  useEffect(() => {
    const now = new Date()
    const filtered = votes.filter(vote => {

      const endDate = new Date(vote.data.startDate + voteTime)
      const open = isBefore(now, endDate)
      const type = vote.data.type
      vote.quorumProgress = getQuorumProgress(vote.data)
      vote.minParticipationPct = minParticipationPct
      const voteStatus = getVoteStatus(vote)

      // Status - 0: All, 1: Open, 2: Closed
      if (statusFilter > 0) {
        if (statusFilter === 1 && !isBefore(now, endDate)) return false
        if (statusFilter === 2 && isBefore(now, endDate)) return false
      }

      // 0: All, 1: Allocations, 2: Curation, 3: Informational
      if (appFilter > 0) {
        if (appFilter === 1 && type !== 'allocation') return false
        if (appFilter === 2 && type !== 'curation') return false
        if (appFilter === 3 && type !== 'informational') return false
      }

      // Outcome - 0: All, 1: Passed, 2: Rejected, 3: Enacted, 4: Pending
      if (outcomeFilter > 0) {
        if (open) return false
        if (outcomeFilter === 1 &&
          !(voteStatus === VOTE_STATUS_SUCCESSFUL || voteStatus === VOTE_STATUS_EXECUTED)
        ) return false
        if (outcomeFilter === 2 && voteStatus !== VOTE_STATUS_FAILED) return false
        if (outcomeFilter === 3 && voteStatus !== VOTE_STATUS_EXECUTED) return false
        if (outcomeFilter === 4 && voteStatus !== VOTE_STATUS_SUCCESSFUL) return false
      }
      return true
    })

    setFilteredVotes(filtered)
  }, [
    statusFilter,
    outcomeFilter,
    appFilter,
    setFilteredVotes,
    votes,
  ])

  return {
    filteredVotes,
    voteStatusFilter: statusFilter,
    handleVoteStatusFilterChange: useCallback(
      index => {
        setStatusFilter(!index ? -1 : index)
      },
      [setStatusFilter]
    ),
    voteOutcomeFilter: outcomeFilter,
    handleVoteOutcomeFilterChange: useCallback(
      index => setOutcomeFilter(!index ? -1 : index),
      [setOutcomeFilter]
    ),
    voteAppFilter: appFilter,
    handleVoteAppFilterChange: useCallback(
      index => setAppFilter(!index ? -1 : index),
      [setAppFilter]
    ),
    handleClearFilters,
  }
}

const tokenAbi = [].concat(tokenBalanceOfAbi, tokenDecimalsAbi, tokenSymbolAbi)

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
  const { layoutName } = useLayout()
  const theme = useTheme()

  const getTokenContract = (tokenAddress) =>
    tokenAddress && app.external(tokenAddress, tokenAbi)

  const tokenContract = getTokenContract(tokenAddress)

  const now = new Date()

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

  const {
    filteredVotes,
    voteStatusFilter,
    handleVoteStatusFilterChange,
    voteOutcomeFilter,
    handleVoteOutcomeFilterChange,
    voteAppFilter,
    handleVoteAppFilterChange,
    handleClearFilters,
  } = useFilterVotes(votes, voteTime, minParticipationPct)

  // Add useful properties to the votes
  const preparedVotes = filteredVotes.map(vote => {
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

  const currentVote =
      currentVoteId === -1
        ? null
        : preparedVotes.find(vote => vote.voteId === currentVoteId)

  if (currentVote) return  (
    <React.Fragment>
      <Bar>
        <BackButton onClick={handleBackClick} />
      </Bar>
      <VoteDetails
        app={app}
        vote={currentVote}
        userAccount={userAccount}
        tokenContract={tokenContract}
        onVote={handleVote}
        minParticipationPct={minParticipationPct}
      />
    </React.Fragment>
  )

  const illustration = <img src={emptyStatePng} alt="" height="160" />

  if (!votes.length) return (
    <div css={`
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: -1;
    `}
    >
      <EmptyStateCard
        title="You do not have any dot votes."
        text="Use the Allocations app to get started."
        onActivate={() => <div />}
        illustration={illustration}
      />
    </div>
  )

  if (!filteredVotes.length) return (
    <EmptyFilteredVotes onClear={handleClearFilters} />
  )

  return (
    <React.Fragment>
      {layoutName !== 'small' && (
        <Bar>
          <div
            css={`
            height: ${8 * GU}px;
            display: grid;
            grid-template-columns: auto auto auto 1fr;
            grid-gap: ${1 * GU}px;
            align-items: center;
            padding-left: ${3 * GU}px;
          `}
          >
            <DropDown
              selected={voteStatusFilter}
              onChange={handleVoteStatusFilterChange}
              label="Status"
              items={[
                // eslint-disable-next-line react/jsx-key
                <div>
                All
                  <span
                    css={`
                    margin-left: ${1.5 * GU}px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    color: ${theme.info};
                    ${textStyle('label3')};
                  `}
                  >
                    <DiscTag>
                      {votes.length > 9999 ? '9999+' : votes.length}
                    </DiscTag>
                  </span>
                </div>,
                'Open',
                'Closed',
              ]}
              width="128px"
            />
            {voteStatusFilter !== 1 && (
              <DropDown
                label="Outcome"
                selected={voteOutcomeFilter}
                onChange={handleVoteOutcomeFilterChange}
                items={[ 'All', 'Passed', 'Rejected', 'Enacted', 'Pending' ]}
                width="128px"
              />
            )}
            <DropDown
              label="App type"
              selected={voteAppFilter}
              onChange={handleVoteAppFilterChange}
              items={[ 'All', 'Allocations', 'Issue Curation', 'Informational' ]}
              width="128px"
            />
          </div>
        </Bar>
      )}

      <Votes
        votes={preparedVotes}
        onSelectVote={handleVoteOpen}
        app={app}
        userAccount={userAccount}
      />

    </React.Fragment>
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

const DiscTag = styled.span`
  display: inline-flex;
  white-space: nowrap;
  color: rgb(109, 128, 136);
  padding-top: 2px;
  letter-spacing: -0.5px;
  /* stylelint-disable-next-line property-no-vendor-prefix */
  -webkit-box-pack: center;
  justify-content: center;
  /* stylelint-disable-next-line property-no-vendor-prefix */
  -webkit-box-align: center;
  align-items: center;
  width: 18px;
  height: 18px;
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  background: rgb(220, 234, 239);
  overflow: hidden;
  border-radius: 9px;
`

export default Decisions
