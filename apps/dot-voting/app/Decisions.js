import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import AppLayout from './components/AppLayout'
import emptyIcon from './assets/new_dot_vote.svg'
import Votes from './components/Votes'
import tokenBalanceOfAbi from './abi/token-balanceof.json'
import tokenDecimalsAbi from './abi/token-decimals.json'
import tokenSymbolAbi from './abi/token-symbol.json'
import { safeDiv } from './utils/math-utils'
import { hasLoadedVoteSettings } from './utils/vote-settings'
import { isBefore } from 'date-fns'
import { EmptyStateCard, SidePanel, breakpoint } from '@aragon/ui'
import { VotePanelContent } from './components/Panels'
import { EMPTY_CALLSCRIPT, getQuorumProgress, getTotalSupport } from './utils/vote-utils'

const tokenAbi = [].concat(tokenBalanceOfAbi, tokenDecimalsAbi, tokenSymbolAbi)

const EmptyIcon = () => <img src={emptyIcon} alt="" />

class Decisions extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
  }
  constructor(props) {
    super(props)
    this.state = {
      createVoteVisible: false,
      currentVoteId: 0,
      settingsLoaded: true,
      tokenContract: this.getTokenContract(props.tokenAddress),
      voteVisible: false,
      voteSidebarOpened: false,
    }
  }

  componentWillMount() {
    this.setState({
      now : new Date()
    })
  }

  componentDidMount() {
    setInterval( () => {
      this.setState({
        now : new Date()
      })
    },1000)
  }

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

  getTokenContract(tokenAddress) {
    return tokenAddress && this.props.app.external(tokenAddress, tokenAbi)
  }
  handleCreateVote = question => {
    this.props.app.newVote(EMPTY_CALLSCRIPT, question)
    this.handleCreateVoteClose()
  }
  handleCreateVoteOpen = () => {
    this.setState({ createVoteVisible: true })
  }
  handleCreateVoteClose = () => {
    this.setState({ createVoteVisible: false })
  }
  handleVoteOpen = voteId => {
    const exists = this.props.votes.some(vote => voteId === vote.voteId)
    if (!exists) return
    this.setState({
      currentVoteId: voteId,
      voteVisible: true,
      voteSidebarOpened: false,
    })
  }
  handleVote = (voteId, supports) => {
    this.props.app.vote(voteId, supports)
    this.handleVoteClose()
  }
  handleVoteClose = () => {
    this.setState({ voteVisible: false })
  }
  handleVoteTransitionEnd = opened => {
    this.setState(opened ? { voteSidebarOpened: true } : { currentVoteId: -1 })
  }

  getAddressLabel = (entries, option) => {
    const index = entries.findIndex(entry => entry.addr === option.label)
    return index > -1 ? entries[index].data.name : option.label
  }
  render() {
    const {
      app,
      pctBase,
      minParticipationPct,
      userAccount,
      votes,
      entries,
      voteTime,
    } = this.props
    const {
      createVoteVisible,
      currentVoteId,
      settingsLoaded,
      tokenContract,
      voteSidebarOpened,
      voteVisible,
    } = this.state

    const displayVotes = settingsLoaded && votes.length > 0

    // Add useful properties to the votes
    const preparedVotes = displayVotes
      ? votes.map(vote => {
        const endDate = new Date(vote.data.startDate + voteTime)
        vote.data.options = vote.data.options.map(option => {
          return {
            ...option,
            label: this.getAddressLabel(entries, option)
          }
        })
        return {
          ...vote,
          endDate,
          open: isBefore(this.state.now, endDate),
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
        <AppLayout.ScrollWrapper>
          {displayVotes ? (
            <Votes votes={preparedVotes} onSelectVote={this.handleVoteOpen} app={app}/>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexGrow: 1
              }}
            >
              <EmptyStateCard
                icon={<EmptyIcon />}
                title="You do not have any dot votes."
                text="Use the Allocations app to get started."
                actionButton={() => <div />}
              />
            </div>
          )}
        </AppLayout.ScrollWrapper>

        {displayVotes && currentVote &&(
          <SidePanel
            title={'Dot Vote #' + currentVote.voteId}
            opened={Boolean(!createVoteVisible && voteVisible)}
            onClose={this.handleVoteClose}
            onTransitionEnd={this.handleVoteTransitionEnd}
          >
            <VotePanelContent
              app={app}
              vote={currentVote}
              user={userAccount}
              ready={voteSidebarOpened}
              tokenContract={tokenContract}
              onVote={this.handleVote}
              minParticipationPct={minParticipationPct}
            />
          </SidePanel>
        )}
      </StyledDecisions>
    )
  }
}

const StyledDecisions = styled.div`
  ${breakpoint(
    'small',
    `
    padding: 2rem;
    `
  )};
  padding: 0.3rem;
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  overflow: auto;
  flex-grow: 1;
`

export default Decisions
