import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import emptyIcon from './assets/new_dot_vote.svg'
import Votes from './components/Votes'
import tokenBalanceOfAbi from './abi/token-balanceof.json'
import tokenDecimalsAbi from './abi/token-decimals.json'
import tokenSymbolAbi from './abi/token-symbol.json'
import { safeDiv } from './utils/math-utils'
import { hasLoadedVoteSettings } from './utils/vote-settings'
import { isBefore } from 'date-fns'
import { EmptyStateCard } from '@aragon/ui'
import { EMPTY_CALLSCRIPT, getQuorumProgress, getTotalSupport } from './utils/vote-utils'

const tokenAbi = [].concat(tokenBalanceOfAbi, tokenDecimalsAbi, tokenSymbolAbi)

const EmptyIcon = () => <img src={emptyIcon} alt="" />

class Decisions extends React.Component {
  static propTypes = {
    app: PropTypes.object,
    votes: PropTypes.arrayOf(PropTypes.object).isRequired,
    entries: PropTypes.arrayOf(PropTypes.object).isRequired,
    minParticipationPct: PropTypes.number.isRequired,
    pctBase: PropTypes.number.isRequired,
    voteTime: PropTypes.number.isRequired,
    onSelectVote: PropTypes.func.isRequired,
  }
  constructor(props) {
    super(props)
    this.state = {
      createVoteVisible: false,
      currentVoteId: 0,
      settingsLoaded: true,
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
  }

  getTokenContract(tokenAddress) {
    return tokenAddress && this.props.app.external(tokenAddress, tokenAbi)
  }
  handleCreateVote = question => {
    this.props.app.newVote(EMPTY_CALLSCRIPT, question).toPromise()
    this.handleCreateVoteClose()
  }
  handleCreateVoteOpen = () => {
    this.setState({ createVoteVisible: true })
  }
  handleCreateVoteClose = () => {
    this.setState({ createVoteVisible: false })
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
      votes,
      entries,
      voteTime,
      onSelectVote,
    } = this.props
    const {
      settingsLoaded,
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

    return (
      <StyledDecisions>
        <ScrollWrapper>
          {displayVotes ? (
            <Votes votes={preparedVotes} onSelectVote={onSelectVote} app={app}/>
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
                onActivate={() => <div />}
              />
            </div>
          )}
        </ScrollWrapper>
      </StyledDecisions>
    )
  }
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
