import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import Blockies from 'react-blockies'
import {
  Button,
  Info,
  SafeLink,
  SidePanelSplit,
  SidePanelSeparator,
  Countdown,
  Text,
  theme,
  Slider,
} from '@aragon/ui'
import { combineLatest } from '../../rxjs'
import provideNetwork from '../../utils/provideNetwork'
import { VOTE_NAY, VOTE_YEA } from '../../utils/vote-types'
import VoteSummary from '../VoteSummary'
import VoteStatus from '../VoteStatus'

class VotePanelContent extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
  }
  state = {
    userCanVote: false,
    userBalance: null,
    showResults: false,
  }
  componentDidMount() {
    this.loadUserCanVote()
    this.loadUserBalance()
  }
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.user !== this.props.user) {
      this.loadUserCanVote()
    }
    if (nextProps.tokenContract !== this.props.tokenContract) {
      this.loadUserBalance()
    }
  }
  handleNoClick = () => {
    this.props.onVote(this.props.vote.voteId, VOTE_NAY)
  }
  handleYesClick = () => {
    // TODO: add a manual execute button and checkboxes to let user select if
    // they want to auto execute
    this.props.onVote(this.props.vote.voteId, VOTE_YEA)
  }
  loadUserBalance = () => {
    const { tokenContract, user } = this.props
    if (tokenContract && user) {
      combineLatest(tokenContract.balanceOf(user), tokenContract.decimals())
        .first()
        .subscribe(([balance, decimals]) => {
          const adjustedBalance = Math.floor(
            parseInt(balance, 10) / Math.pow(10, decimals),
          )
          this.setState({
            userBalance: adjustedBalance,
          })
        })
    }
  }
  loadUserCanVote = () => {
    const { app, user, vote } = this.props
    if (user && vote) {
      // Get if user can vote
      app
        .call('canVote', vote.voteId, user)
        .first()
        .subscribe(canVote => {
          this.setState({
            userCanVote: canVote,
          })
        })
    }
  }
  renderDescription = (description = '') => {
    // Make '\n's real breaks
    return description.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        <br />
      </React.Fragment>
    ))
  }
  render() {
    const { etherscanBaseUrl, vote, ready } = this.props
    const { userBalance, userCanVote, showResults } = this.state
    if (!vote) {
      return null
    }

    const { endDate, open, quorum, quorumProgress, support } = vote
    const {
      creator,
      metadata,
      totalVoters,
      description,
      candidates,
    } = vote.data

    // const creatorName = 'Robert Johnson' // TODO: get creator name

    return (
      <div>
        <SidePanelSplit>
          <div>
            <h2>
              <Label>Created by</Label>
            </h2>
            <Creator>
              <CreatorImg>
                <Blockies seed={creator} size={8} />
              </CreatorImg>
              <div>
                <p>
                  <SafeLink
                    href={`${etherscanBaseUrl}/address/${creator}`}
                    target="_blank"
                  >
                    {creator}
                  </SafeLink>
                </p>
              </div>
            </Creator>
          </div>
          <div>
            <h2>
              <Label>{open ? 'Time Remaining:' : 'Status'}</Label>
            </h2>
            <div>
              {open ? (
                <Countdown end={endDate} />
              ) : (
                <VoteStatus
                  vote={vote}
                  support={support}
                  tokenSupply={totalVoters}
                />
              )}
            </div>
          </div>
        </SidePanelSplit>
        <Part>
          {description && (
            <React.Fragment>
              <h2>
                <Label>Description:</Label>
              </h2>
              <p>{this.renderDescription(description)}</p>
            </React.Fragment>
          )}
        </Part>
        <SidePanelSplit>
          <div>
            <h2>
              <Label>Amount</Label>
            </h2>
            <p>100 ETH (One-Time)</p>
          </div>
          <div>
            <h2>
              <Label>Dates</Label>
            </h2>
            <p>When vote is approved</p>
          </div>
        </SidePanelSplit>
        <SidePanelSplit>
          <div>
            <h2>
              <Label>Voter participation</Label>
            </h2>
            <p>
              24% <RedText>(34% quorum required)</RedText>
            </p>
          </div>
          <div>
            <h2>
              <Label>Your voting tokens</Label>
            </h2>
            <p>100</p>
          </div>
        </SidePanelSplit>
        {open && (
          <div>
            <AdjustContainer>
              <FirstLabel>Options</FirstLabel>
              <SecondLabel>Votes</SecondLabel>
              <Slider />
              <Button mode="strong" wide>
                Submit Vote
              </Button>
            </AdjustContainer>
            <SidePanelSeparator />
          </div>
        )}
        <ShowText onClick={() => this.setState({ showResults: !showResults })}>
          {showResults ? 'Hide Voting Results' : 'Show Voting Results'}
        </ShowText>
      </div>
    )
  }
}

const Label = styled(Text).attrs({
  smallcaps: true,
  color: theme.textSecondary,
})`
  display: block;
  margin-bottom: 10px;
`
const FirstLabel = styled(Label)`
  display: inline-block;
`

const SecondLabel = styled(Label)`
  float: right;
`

const AdjustContainer = styled.div`
  padding: 1rem 0;
`

const ShowText = styled.p`
  color: #21aae7;
  font-size: 15px;
  text-decoration: underline;
  margin-top: 1rem;
  cursor: pointer;
`

const RedText = styled.span`
  color: #e31733;
  font-size: 14px;
`

const Part = styled.div`
  padding: 20px 0;
  h2 {
    margin-top: 20px;
    &:first-child {
      margin-top: 0;
    }
  }
`

const Question = styled.p`
  max-width: 100%;
  overflow: hidden;
  word-break: break-all;
  hyphens: auto;
`

const Creator = styled.div`
  display: flex;
  align-items: center;
`
const CreatorImg = styled.div`
  margin-right: 20px;
  canvas {
    display: block;
    border: 1px solid ${theme.contentBorder};
    border-radius: 16px;
  }
  & + div {
    a {
      color: ${theme.accent};
    }
  }
`

const VotingButtons = styled.div`
  display: flex;
  padding: 30px 0 20px;
  & > * {
    width: 50%;
    &:first-child {
      margin-right: 10px;
    }
  }
`

export default provideNetwork(VotePanelContent)
