import React, { useCallback, useEffect, useState }  from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import Votes from './components/Votes'
import { isBefore } from 'date-fns'
import { useAragonApi } from '@aragon/api-react'
import { BackButton, Bar, DropDown, GU, textStyle, useLayout, useTheme } from '@aragon/ui'
import VoteDetails from './components/VoteDetails'
import { getQuorumProgress } from './utils/vote-utils'
import { getVoteStatus } from './utils/vote-utils'
import EmptyFilteredVotes from './components/EmptyFilteredVotes'
import {
  VOTE_STATUS_EXECUTED,
  VOTE_STATUS_FAILED,
  VOTE_STATUS_SUCCESSFUL,
} from './utils/vote-types'

const useFilterVotes = (votes, voteTime) => {
  const [ filteredVotes, setFilteredVotes ] = useState(votes)
  // Status - 0: All, 1: Open, 2: Closed
  const [ statusFilter, setStatusFilter ] = useState(0)
  // Outcome - 0: All, 1: Passed, 2: Rejected, 3: Enacted, 4: Pending
  const [ outcomeFilter, setOutcomeFilter ] = useState(0)
  // 0: All, 1: Allocations, 2: Curation, 3: Informational
  const [ appFilter, setAppFilter ] = useState(0)

  const handleClearFilters = useCallback(() => {
    setStatusFilter(0)
    setOutcomeFilter(0)
    setAppFilter(0)
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
        setStatusFilter(index)
      },
      [setStatusFilter]
    ),
    voteOutcomeFilter: outcomeFilter,
    handleVoteOutcomeFilterChange: useCallback(
      index => setOutcomeFilter(index),
      [setOutcomeFilter]
    ),
    voteAppFilter: appFilter,
    handleVoteAppFilterChange: useCallback(
      index => setAppFilter(index),
      [setAppFilter]
    ),
    handleClearFilters,
  }
}

const Decisions = ({ decorateVote }) => {
  const { api: app, appState, connectedAccount } = useAragonApi()
  const { votes, voteTime } = appState

  const { layoutName } = useLayout()
  const theme = useTheme()

  // TODO: accomplish this with routing (put routes in App.js, not here)
  const [ currentVoteId, setCurrentVoteId ] = useState(-1)
  const handleVote = useCallback(async (voteId, supports) => {
    await app.vote(voteId, supports).toPromise()
    setCurrentVoteId(-1) // is this correct?
  }, [app])
  const handleBackClick = useCallback(() => {
    setCurrentVoteId(-1)
  }, [])
  const handleVoteOpen = useCallback(voteId => {
    const exists = votes.some(vote => voteId === vote.voteId)
    if (!exists) return
    setCurrentVoteId(voteId)
  }, [votes])

  const {
    filteredVotes,
    voteStatusFilter,
    handleVoteStatusFilterChange,
    voteOutcomeFilter,
    handleVoteOutcomeFilterChange,
    voteAppFilter,
    handleVoteAppFilterChange,
    handleClearFilters,
  } = useFilterVotes(votes, voteTime)

  const currentVote =
      currentVoteId === -1
        ? null
        : decorateVote(
          filteredVotes.find(vote => vote.voteId === currentVoteId)
        )

  if (currentVote) {
    return (
      <React.Fragment>
        <Bar>
          <BackButton onClick={handleBackClick} />
        </Bar>
        <VoteDetails vote={currentVote} onVote={handleVote} />
      </React.Fragment>
    )
  }

  if (!filteredVotes.length) return (
    <EmptyFilteredVotes onClear={handleClearFilters} />
  )

  const preparedVotes = filteredVotes.map(decorateVote)

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
                items={[ 'Outcome', 'Passed', 'Rejected', 'Enacted', 'Pending' ]}
                width="128px"
              />
            )}
            <DropDown
              label="App type"
              selected={voteAppFilter}
              onChange={handleVoteAppFilterChange}
              items={[ 'Type', 'Allocations', 'Issue Curation', 'Informational' ]}
              width="128px"
            />
          </div>
        </Bar>
      )}

      <Votes
        votes={preparedVotes}
        onSelectVote={handleVoteOpen}
        app={app}
        userAccount={connectedAccount}
      />

    </React.Fragment>
  )
}

Decisions.propTypes = {
  decorateVote: PropTypes.func.isRequired,
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
