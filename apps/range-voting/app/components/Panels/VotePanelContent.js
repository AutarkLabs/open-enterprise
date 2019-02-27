import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import Blockies from 'react-blockies'
import { BigNumber } from 'bignumber.js'
import {
  Button,
  Info,
  SafeLink,
  SidePanelSplit,
  SidePanelSeparator,
  Countdown,
  Text,
  theme,
} from '@aragon/ui'
import { combineLatest } from '../../rxjs'
import provideNetwork from '../../utils/provideNetwork'
import { VOTE_NAY, VOTE_YEA } from '../../utils/vote-types'
import { safeDiv } from '../../utils/math-utils'
import VoteSummary from '../VoteSummary'
import VoteStatus from '../VoteStatus'
import ProgressBarThick from '../ProgressBarThick'
import Slider from '../Slider'

class VotePanelContent extends React.Component {
  static propTypes = {
    app: PropTypes.object, // TODO: isRequired?
  }
  state = {
    userCanVote: false,
    userBalance: null,
    showResults: false,
    voteOptions: [],
    remaining: 100,
  }
  componentDidMount() {
    this.loadUserCanVote()
    this.loadUserBalance()
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.user !== this.props.user) {
      this.loadUserCanVote()
    }
    if (nextProps.tokenContract !== this.props.tokenContract) {
      this.loadUserBalance()
    }
  }
  handleVoteSubmit = () => {
    let optionsArray = []

    this.state.voteOptions.forEach(element => {
      let voteWeight = element.sliderValue
        ? Math.round(
          parseFloat(
            (element.sliderValue * this.state.userBalance).toFixed(2)
          )
        )
        : 0
      optionsArray.push(voteWeight)
    })

    //re-proportion the supports values so they don't exceed the total balance
    const valueTotal = optionsArray.reduce((a, b) => a + b, 0)
    optionsArray = optionsArray.map(tokenSupport => ( tokenSupport / valueTotal ) * parseInt(this.state.userBalance) )
    // TODO: Let these comments here for a while to be sure we are working with correct values:
    console.log('Sum of values:', valueTotal)
    console.log('userBalance', this.state.userBalance)
    console.log(
      'onVote voteId:',
      this.props.vote.voteId,
      'optionsArray',
      optionsArray
    )
    this.props.onVote(this.props.vote.voteId, optionsArray)
  }
  executeVote = () => {
    this.props.app.executeVote(this.props.vote.voteId)
  }
  loadUserBalance = () => {
    const { tokenContract, user } = this.props
    if (tokenContract && user) {
      combineLatest(tokenContract.balanceOf(user), tokenContract.decimals())
        .first()
        .subscribe(([balance, decimals]) => {
          this.setState({
            userBalance: balance,
            decimals: decimals
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
  sliderUpdate = (value, idx) => {
    const total = this.state.voteOptions.reduce(
      (acc, { sliderValue }, index) => {
        return (
          acc +
          (idx === index
            ? Math.round(value * 100) || 0
            : Math.round(sliderValue * 100) || 0)
        )
      },
      0
    )
    if (total <= 100) {
      this.state.voteOptions[idx].sliderValue = value
      this.setState({ remaining: 100 - total })
    }
  }
  render() {
    const { etherscanBaseUrl, vote, ready, minParticipationPct } = this.props
    const {
      userBalance,
      userCanVote,
      showResults,
      voteOptions,
      remaining,
    } = this.state
    if (!vote) {
      return null
    }

    const { endDate, open, quorum, support } = vote
    const {
      participationPct,
      canExecute,
      creator,
      metadata,
      totalVoters,
      description,
      candidates,
      options,
      type,
    } = vote.data
    const displayBalance = BigNumber(vote.data.balance)
      .div(BigNumber(10 ** this.state.decimals))
      .dp(3)
      .toString()
    // TODO: Show decimals for vote participation only when needed
    const displayParticipationPct = (participationPct).toFixed(2)
    const displayMinParticipationPct = (minParticipationPct / 10 ** 16).toFixed(2)
    // TODO: This block is wrong and has no sense
    if (!voteOptions.length) {
      this.state.voteOptions = options
    }

    let totalSupport = 0
    options.forEach(option => {
      totalSupport = totalSupport + parseFloat(option.value, 10)
    })

    const showInfo = type === 'allocation' || type === 'curation'
    const truncatedCreator = `${creator.slice(0, 6)}...${creator.slice(-4)}`

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
                  {/* // TODO: Change to etherscanUrl constant for the selected network*/}
                  <SafeLink
                    href={`https://rinkeby.etherscan.io/address/${creator}`}
                    target="_blank"
                    title={creator}
                  >
                    {truncatedCreator}
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
        {description && (
          <Part>
            <React.Fragment>
              <h2>
                <Label>Description:</Label>
              </h2>
              <p>{this.renderDescription(description)}</p>
            </React.Fragment>
          </Part>
        )}

        {vote.data.balance !== undefined && (
          <SidePanelSplit style={{ borderBottom: 'none' }}>
            <div>
              <h2>
                <Label>Amount</Label>
              </h2>
              <p>
                {' ' + displayBalance + ' ETH'}
              </p>
            </div>
            <div>
              <h2>
                <Label>Dates</Label>
              </h2>
              <p>When vote is approved</p>
            </div>
          </SidePanelSplit>
        )}
        <SidePanelSplit>
          <div>
            <h2>
              <Label>Voter participation</Label>
            </h2>
            <p>
              {displayParticipationPct}%{' '}
              <Text size="small" color={theme.negative}>
                ({displayMinParticipationPct}% required)
              </Text>
            </p>
          </div>
          <div>
            <h2>
              <Label>Your voting tokens</Label>
            </h2>
            {BigNumber(this.state.userBalance)
              .div(BigNumber(10 ** (this.state.decimals)))
              .dp(3)
              .toString()}
          </div>
        </SidePanelSplit>
        {open && (
          <div>
            <AdjustContainer>
              <FirstLabel>Options</FirstLabel>
              <SecondLabel>Votes</SecondLabel>
              {this.state.voteOptions.map((option, idx) => (
                <div key={idx}>
                  <SliderAndValueContainer>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <Text size="small">{option.label}</Text>
                      <div
                        style={{
                          display: 'flex',
                          margin: '0.5rem 0 1rem 0',
                        }}
                      >
                        <Slider
                          width="270px"
                          value={option.sliderValue}
                          onUpdate={value => this.sliderUpdate(value, idx)}
                        />
                        <ValueContainer>
                          {Math.round(option.sliderValue * 100) || 0}
                        </ValueContainer>
                      </div>
                    </div>
                  </SliderAndValueContainer>
                </div>
              ))}
              <Text
                size="small"
                color={theme.negative}
                style={{
                  float: 'right',
                }}
              >
                {remaining} remaining
              </Text>
              <SubmitButton mode="strong" wide onClick={this.handleVoteSubmit}>
                Submit Vote
              </SubmitButton>
              {showInfo && (
                <Info.Action title="Info">
                  Vote carefully. After this vote closes, it will result in a
                  financial payment.
                </Info.Action>
              )}
            </AdjustContainer>
            <SidePanelSeparator />
          </div>
        )}
        {!open && (
          <div>
            <SubmitButton mode="strong" wide onClick={this.executeVote}>
              Execute Vote
            </SubmitButton>
          </div>
        )}
        <div>
          <ShowText
            onClick={() => this.setState({ showResults: !showResults })}
          >
            {showResults ? 'Hide Voting Results' : 'Show Voting Results'}
          </ShowText>
          {showResults &&
            options.map((option, index) => (
              <ProgressBarThick
                key={index}
                progress={safeDiv(parseInt(option.value, 10), totalSupport)}
                label={option.label}
              />
            ))}
          {showResults && (
            <Text size="xsmall" color={theme.textSecondary}>
              A minimum of 5% is required for an option to become validated
            </Text>
          )}
        </div>
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
  margin-right: 16px;
`

const AdjustContainer = styled.div`
  padding: 1rem 0;
`

const ValueContainer = styled.div`
  box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.03);
  border-radius: 3px;
  width: 69px;
  height: 40px;
  border: 1px solid ${theme.contentBorder};
  padding-top: 0.5rem;
  text-align: center;
`

const SliderAndValueContainer = styled.div`
  display: flex;
  align-items: center;
`

const SliderContainer = styled.div`
  width: 320px;
  & > :nth-child(2) {
    padding: 0;
    padding-right: 17px;
  }
`

const SubmitButton = styled(Button)`
  margin: 1rem 0;
`

const ShowText = styled.p`
  color: ${theme.accent};
  font-size: 15px;
  text-decoration: underline;
  margin-top: 1rem;
  cursor: pointer;
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
