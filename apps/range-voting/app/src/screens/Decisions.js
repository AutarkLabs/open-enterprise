import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import AppLayout from '../components/AppLayout'
import emptyIcon from '../assets/empty-card-icon.svg'
import Votes from '../components/Votes'
import tokenBalanceOfAbi from '../abi/token-balanceof.json'
import tokenDecimalsAbi from '../abi/token-decimals.json'
import { safeDiv } from '../utils/math-utils'
import { hasLoadedVoteSettings } from '../utils/vote-settings'
import { VOTE_YEA } from '../utils/vote-types'
import { isBefore } from 'date-fns'
import { EmptyStateCard, SidePanel } from '@aragon/ui'
import { VotePanelContent, NewVotePanelContent } from '../components/Panels'
import { EMPTY_CALLSCRIPT, getQuorumProgress } from '../utils/vote-utils'

const tokenAbi = [].concat(tokenBalanceOfAbi, tokenDecimalsAbi)

const EmptyIcon = () => <img src={emptyIcon} alt="" />

class Decisions extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
  }
  static defaultProps = {
    pctBase: 100,
    tokenAddress: null,
    supportRequiredPct: 74,
    userAccount: '',
    votes: [
      {
        voteId: 1,
        data: {
          type: 'allocation',
          creator: '0x123342',
          executed: false,
          minAcceptQuorum: 70,
          snapshotBlock: 10,
          startDate: 2123222340356,
          totalVoters: 30,
          script: 'v_script',
          description: 'this is the first hardcoded vote',
          options: [
            {
              label: 'not necessarily',
              value: 12
            },
            {
              label: 'possibly',
              value: 3
            },
            {
              label: 'maybe',
              value: 9
            },
            {
              label: 'perhaps',
              value: 0
            },
          ],
        },
      },
      {
        voteId: 3,
        data: {
          type: 'informational',
          creator: '0x123342',
          executed: true,
          minAcceptQuorum: 98,
          snapshotBlock: 11,
          startDate: 1123222340356,
          totalVoters: 33,
          script: 'v_script 2',
          description: 'this is second hardcoded vote',
          options: [
            {
              label: 'orange',
              value: 120
            },
            {
              label: 'octarine',
              value: 13
            },
            {
              label: 'darkish grey',
              value: 339
            },
            {
              label: 'almost blue',
              value: 0
            },
          ],
        },
      },
    ],
    voteTime: -1,
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
  handleVote = (voteId, voteType, executesIfDecided = true) => {
    this.props.app.vote(voteId, voteType === VOTE_YEA, executesIfDecided)
    this.handleVoteClose()
  }
  handleVoteClose = () => {
    this.setState({ voteVisible: false })
  }
  handleVoteTransitionEnd = opened => {
    this.setState(opened ? { voteSidebarOpened: true } : { currentVoteId: -1 })
  }
  render() {
    const {
      app,
      pctBase,
      supportRequiredPct,
      userAccount,
      votes,
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
    const supportRequired = settingsLoaded ? supportRequiredPct / pctBase : -1

    console.log('render: ' + settingsLoaded)

    // Add useful properties to the votes
    const preparedVotes = displayVotes
      ? votes.map(vote => {
          const endDate = new Date(vote.data.startDate + voteTime)
          return {
            ...vote,
            endDate,
            // Open if not executed and now is still before end date
            open: !vote.data.executed && isBefore(new Date(), endDate),
            quorum: safeDiv(vote.data.minAcceptQuorum, pctBase),
            quorumProgress: getQuorumProgress(vote.data),
            support: supportRequired,
          }
        })
      : votes

    const currentVote =
      currentVoteId === -1
        ? null
        : preparedVotes.find(vote => vote.voteId === currentVoteId)

    return (
      <Main>
        <AppLayout.ScrollWrapper>
          {displayVotes ? (
            <Votes votes={preparedVotes} onSelectVote={this.handleVoteOpen} />
          ) : (
            <EmptyStateCard
              icon={EmptyIcon}
              title="No votes yet"
              text="No votes"
              actionText="New Vote"
              onActivate={this.handleCreateVoteOpen}
            />
          )}
        </AppLayout.ScrollWrapper>

        {displayVotes && (
          <SidePanel
            title={
              currentVote
                ? `Vote #${currentVoteId} (${
                    currentVote.open ? 'Open' : 'Closed'
                  })`
                : 'currentVote'
            }
            opened={Boolean(!createVoteVisible && voteVisible)}
            onClose={this.handleVoteClose}
            onTransitionEnd={this.handleVoteTransitionEnd}
          >
            {currentVote && (
              <VotePanelContent
                app={app}
                vote={currentVote}
                user={userAccount}
                ready={voteSidebarOpened}
                tokenContract={tokenContract}
                onVote={this.handleVote}
              />
            )}
          </SidePanel>
        )}

        <SidePanel
          title="Create Vote"
          opened={createVoteVisible}
          onClose={this.handleCreateVoteClose}
        >
          <NewVotePanelContent
            opened={createVoteVisible}
            onCreateVote={this.handleCreateVote}
            etherscanBaseUrl="https://rinkeby.etherscan.io"
          />
        </SidePanel>
      </Main>
    )
  }
}

const Main = styled.div`
  display: flex;
`

export default Decisions
