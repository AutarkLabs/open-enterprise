import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { BigNumber } from 'bignumber.js'
import {
  Badge,
  Button,
  IdentityBadge,
  Info,
  SidePanelSplit,
  SidePanelSeparator,
  Countdown,
  Text,
  theme,
} from '@aragon/ui'
import { format } from 'date-fns'
import { combineLatest } from '../../rxjs'
import { first } from 'rxjs/operators' // Make sure observables have .first
import { provideNetwork } from '../../../../../shared/ui'
import { safeDiv } from '../../utils/math-utils'
import VoteStatus from '../VoteStatus'
import ProgressBarThick from '../ProgressBarThick'
import Slider from '../Slider'
import { getVoteStatus } from '../../utils/vote-utils'
import {
  VOTE_STATUS_SUCCESSFUL
} from '../../utils/vote-types'
import { isAddress } from 'web3-utils'

class VotePanelContent extends React.Component {
  static propTypes = {
    app: PropTypes.object, // TODO: isRequired?
    network: PropTypes.object,
  }
  state = {
    userCanVote: false,
    userBalance: null,
    showResults: false,
    voteOptions: [],
    remaining: 100,
    voteWeightsToggled: true,
    votesWeights: [],
    voteAmounts: [],
  }
  componentDidMount() {
    this.loadUserCanVote()
    this.loadUserBalance()
    this.getVoterState()
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
      let voteWeight = element.trueValue
        ? Math.round(
          parseFloat(
            (element.trueValue * this.state.userBalance).toFixed(2)
          )
        )
        : 0
      optionsArray.push(voteWeight)
    })

    //re-proportion the supports values so they don't exceed the total balance
    const valueTotal = optionsArray.reduce((a, b) => a + b, 0)
    valueTotal > parseInt(this.state.userBalance)
      ? (optionsArray = optionsArray.map(
        tokenSupport =>
          (tokenSupport / valueTotal) *
            (parseInt(this.state.userBalance) * 0.9999)
      ))
      : 0
    this.props.onVote(this.props.vote.voteId, optionsArray)
  }
  executeVote = () => {
    this.props.app.executeVote(this.props.vote.voteId)
    this.setState({ panel: { visible: false } })
  }
  loadUserBalance = () => {
    const { tokenContract, user } = this.props
    const { snapshotBlock } = this.props.vote.data
    if (tokenContract && user) {
      combineLatest(tokenContract.balanceOfAt(user, snapshotBlock), tokenContract.decimals(), tokenContract.symbol())
        .pipe(first())
        .subscribe(([ balance, decimals, symbol ]) => {
          this.setState({
            userBalance: balance,
            decimals: decimals,
            voteTokenSymbol: symbol,
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
        .pipe(first())
        .subscribe(canVote => {
          this.setState({
            userCanVote: canVote,
          })
        })
    }
  }

  sliderUpdate = (value, idx) => {
    const total = this.state.voteOptions.reduce(
      (acc, { trueValue }, index) => {
        return (
          acc +
          (idx === index
            ? Math.round(value * 100) || 0
            : trueValue || 0)
        )
      },
      0
    )
    if (total <= 100) {
      this.state.voteOptions[idx].sliderValue = value
      this.state.voteOptions[idx].trueValue = Math.round(value * 100)
      this.setState({ remaining: 100 - total })
    }
  }

  getVoterState = async () => {
    const result = await this.props.app
      .call('getVoterState', this.props.vote.voteId, this.props.user)
      .toPromise()

    const totalVotesCount = result.reduce(
      (acc, vote) => acc.plus(vote),
      new BigNumber(0)
    )

    const voteWeights = result.map(e =>
      BigNumber(e)
        .div(totalVotesCount)
        .times(100)
        .dp(2)
        .toString()
    )
    const voteAmounts = result.map(e =>
      BigNumber(e)
        .div(BigNumber(10 ** this.state.decimals))
        .toString()
    )
    this.setState({ voteAmounts, voteWeights })

  }

  render() {
    const { network, vote, minParticipationPct } = this.props
    const {
      showResults,
      remaining,
      voteAmounts,
      voteWeights,
      voteWeightsToggled,
      userBalance,
      voteOptions,
      decimals,
      voteTokenSymbol
    } = this.state

    if (!vote) {
      return null
    }
    const { endDate, open, support, description } = vote
    const {
      participationPct,
      creator,
      totalVoters,
      options,
      type,
      candidateSupport,
      tokenSymbol,
      balance: voteBalance,
    } = vote.data
    const displayBalance = BigNumber(voteBalance)
      .div(BigNumber(10 ** decimals))
      .dp(3)
      .toString()

    const displayUserBalance = BigNumber(userBalance)
      .div(BigNumber(10 ** decimals))
      .dp(3)
      .toString()
    const displayCandidateSupport = BigNumber(candidateSupport)
      .div(BigNumber(10 ** 16))
      .dp(3)
      .toString()
    // TODO: Show decimals for vote participation only when needed
    const displayParticipationPct = participationPct.toFixed(2)
    const displayMinParticipationPct = minParticipationPct.toFixed(0)
    // TODO: This block is wrong and has no sense
    if (!voteOptions.length) {
      this.state.voteOptions = options
    }
    let totalSupport = 0
    options.forEach(option => {
      totalSupport = totalSupport + parseFloat(option.value, 10)
    })
    const showInfo = type === 'allocation' || type === 'curation'

    const formatDate = date =>
      format(date, 'dd/MM/yy') + ' at '  + format(date, 'HH:mm') + 'UTC'

    return (
      <div>
        <SidePanelSplit>
          <div>
            <h2>
              <Label>Created by</Label>
            </h2>
            <Creator>
              <IdentityBadge
                networkType={network.type}
                entity={creator}
                shorten={true}
              />
            </Creator>
          </div>
          <div>
            <h2>
              <Label>{open ? 'Time Remaining' : 'Status'}</Label>
            </h2>
            <div>
              {open ? (
                <Countdown end={endDate} />
              ) : (
                <React.Fragment>
                  <VoteStatus
                    vote={vote}
                    support={support}
                    tokenSupply={totalVoters}
                  />
                  <PastDate
                    dateTime={format(endDate, 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx')}
                  >
                    {format(endDate, 'MMM dd yyyy HH:mm')}
                  </PastDate>

                </React.Fragment>
              )}
            </div>
          </div>
        </SidePanelSplit>
        {description && (
          <Part>
            <React.Fragment>
              <h2>
                <Label>Description</Label>
              </h2>
              <p>{description}</p>
            </React.Fragment>
          </Part>
        )}
        <SidePanelSplit>
          <div>
            {voteBalance !== undefined ? (
              <React.Fragment>
                <h2>
                  <Label>Allocation Amount</Label>
                </h2>
                <p>{' ' + displayBalance + ' ' + tokenSymbol}</p>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <h2>
                  <Label>Total Issues</Label>
                </h2>
                <p>{options.length}</p>
              </React.Fragment>
            )}
          </div>
          <div>
            <h2>
              <Label>Voter Participation</Label>
            </h2>
            <p>
              {displayParticipationPct}%{' '}
              <Text size="small" color={theme.textSecondary}>
                ({displayMinParticipationPct}% needed)
              </Text>
            </p>
          </div>
        </SidePanelSplit>

        {open && (userBalance !== '0') && (
          <div>
            <AdjustContainer>
              <FirstLabel>Options</FirstLabel>
              <SecondLabel>Percentage</SecondLabel>
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
                          {option.trueValue || 0}
                        </ValueContainer>
                      </div>
                    </div>
                  </SliderAndValueContainer>
                </div>
              ))}
              <Text
                size="small"
                color={theme.textSecondary}
                style={{
                  float: 'right',
                }}
              >
                {remaining} remaining
              </Text>
              <div>
                <SubmitButton mode="strong" wide onClick={this.handleVoteSubmit}>
                Submit Vote
                </SubmitButton>
                <div>
                  {showInfo && (
                    <Info.Action title="Info">
                      You will cast your vote with{' '}
                      {displayUserBalance + ' ' + voteTokenSymbol}
                      , since it was your balance when the vote was created (
                      {formatDate(vote.data.startDate)}
                      )
                    </Info.Action>
                  )}
                </div>
              </div>
            </AdjustContainer>
            <SidePanelSeparator />
          </div>
        )}
        {(getVoteStatus(vote)===VOTE_STATUS_SUCCESSFUL && (endDate < Date.now()) ) && (
          <div>
            <ExecuteButton mode="strong" wide onClick={this.executeVote}>
              Execute Vote
            </ExecuteButton>
          </div>
        )}
        <div>
          {open && (userBalance !== '0') &&
            <ShowText
              onClick={() => this.setState({ showResults: !showResults })}
            >
              {showResults ? 'Hide Voting Results' : 'Show Voting Results'}
            </ShowText>
          }
          {(showResults || !open || (userBalance === '0')) && voteWeights &&
            options.map((option, index) => (
              <React.Fragment>
                <ProgressBarThick
                  key={index}
                  progress={safeDiv(parseInt(option.value, 10), totalSupport)}
                  hasBalance={voteBalance !== undefined}
                  // TODO: Use IdentityBadge for addresses labels once it is integrated on dev branch
                  // (since we don't have a block explorer network context to plug-in yet)
                  // Then truncate the address
                  // TODO: check use case with issue curation
                  label={
                    <span
                      style={{ display: 'flex', justifyContent: 'flex-start' }}
                    >
                      {isAddress(option.label) ? (
                        <IdentityBadge
                          networkType={network.type}
                          entity={option.label}
                          shorten={true}
                        />
                      ) : (
                        <span
                          style={{
                            width: 'auto',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {option.label}
                        </span>
                      )}
                      {Boolean(voteWeights.length) && (
                        <Badge.Identity
                          onClick={() =>
                            this.setState({
                              voteWeightsToggled: !voteWeightsToggled,
                            })
                          }
                          style={{
                            cursor: 'pointer',
                            marginLeft: '8px',
                            padding: '3px 8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                        YOU:
                          <span style={{ paddingLeft: '5px' }}>
                            {voteWeightsToggled
                              ? `${voteWeights[index]}%`
                              : `${voteAmounts[index]}`}
                          </span>
                        </Badge.Identity>
                      )}
                    </span>
                  }
                />
                {voteBalance !== undefined &&
                  <BalanceSplit>
                    {
                      BigNumber(
                        safeDiv(parseInt(option.value, 10), totalSupport) * displayBalance
                      ).dp(2).toString() + ' ' + tokenSymbol
                    }
                  </BalanceSplit>
                }
              </React.Fragment>
            ))}
          {open && (userBalance === '0') &&
        <div>
          <Info.Action title="Warning">
          This account cannot cast a vote because it did not hold any{' '} {voteTokenSymbol} at the time this vote was created (
            {formatDate(vote.data.startDate)}
            )
          </Info.Action>
        </div>}
          {showResults && (candidateSupport > 0) && (
            <Text size="xsmall" color={theme.textSecondary}>
              {'A minimum of ' + displayCandidateSupport + '% is required for an option to become validated'}
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

const ExecuteButton = styled(Button)`
  margin-top: 1rem;
`

const ShowText = styled.p`
  color: ${theme.accent};
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

const BalanceSplit = styled.div`
  display: inline-block;
  width: 25%;
  text-align: right;
`

const Creator = styled.div`
  display: flex;
  align-items: center;
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

const PastDate = styled.time`
  font-size: 13px;
  color: #98a0a2;
  margin-top: 6px;
  display: block;
`


export default provideNetwork(VotePanelContent)
