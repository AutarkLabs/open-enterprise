import React, { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { BigNumber } from 'bignumber.js'
import {
  Box,
  Button,
  Countdown,
  GU,
  IconCheck,
  Info,
  Split,
  Text,
  textStyle,
  useLayout,
  useTheme,
} from '@aragon/ui'
import { format } from 'date-fns'
import { combineLatest } from 'rxjs'
import { first } from 'rxjs/operators' // Make sure observables have .first
import VoteStatus from '../VoteStatus'
import VotingOption from '../VotingOption'
import Slider from '../Slider'
import { getVoteStatus } from '../../utils/vote-utils'
import { GenerateBadge } from '../../utils/vote-styled-components'
import {
  VOTE_STATUS_SUCCESSFUL
} from '../../utils/vote-types'
import { LocalIdentityBadge } from '../../../../../shared/identity'
import { useNetwork } from '@aragon/api-react'
import VotingOptions from '../VotingOptions'
import { Spring, config as springs } from 'react-spring'
import Label from './Label'

const VoteDetails = ({ app, vote, tokenContract, userAccount, onVote, minParticipationPct }) => {
  const network = useNetwork()
  const { layoutName } = useLayout()
  const theme = useTheme()
  const [ remaining, setRemaining ] = useState(100)
  const [ votingMode, setVotingMode ] = useState(false)
  const [ voteWeights, setVoteWeights ] = useState([])
  const [ voteAmounts, setVoteAmounts ] = useState([])
  const [ canIVote, setCanIVote ] = useState(false)
  const [ tokenData, setTokenData ] = useState({
    userBalance: 0,
    decimals: 0,
    voteTokenSymbol: '',
  })
  const [ voteOptions, setVoteOptions ] = useState(
    Array.from(Array(vote.data.options.length), () => ({}))
  )
  const toggleVotingMode = () => setVotingMode(!votingMode)
  const { support, description, voteId } = vote
  const {
    metadata: question,
    participationPct,
    creator,
    totalVoters,
    options,
    type,
  } = vote.data

  useEffect(() => {
    async function getVoterState() {
      const result = await app
        .call('getVoterState', voteId, userAccount)
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
      setVoteWeights(voteWeights)

      if (voteWeights.length) {
        let total = 0
        const sliderValues = []
        voteWeights.map((value, index) => {
          sliderValues[index] = {
            sliderValue: value / 100,
            trueValue: Math.round(value)
          }
          total += Math.round(value)
        })
        setVoteOptions([...sliderValues])
        setRemaining(100 - total)
      }

      const voteAmounts = result.map(e =>
        BigNumber(e)
          .div(BigNumber(10 ** tokenData.decimals))
          .toString()
      )
      setVoteAmounts(voteAmounts)
    }

    function canIVote() {
      if (userAccount && vote) {
        app
          .call('canVote', voteId, userAccount)
          .pipe(first())
          .subscribe(canVote => {
            setCanIVote(canVote)
          })
      }
    }

    function loadUserBalance() {
      const { snapshotBlock } = vote.data
      if (tokenContract && userAccount) {
        combineLatest(
          tokenContract.balanceOfAt(userAccount, snapshotBlock),
          tokenContract.decimals(),
          tokenContract.symbol()
        )
          .pipe(first())
          .subscribe(([ balance, decimals, symbol ]) => {
            setTokenData({
              userBalance: balance,
              decimals: decimals,
              voteTokenSymbol: symbol,
            })
          })
      }
    }
    getVoterState()
    canIVote()
    loadUserBalance()
  }, [ vote, userAccount ])


  const handleExecuteVote = useCallback(e => {
    app.executeVote(voteId)
    e.stopPropagation()
  }, [ app, voteId ])

  const sliderUpdate = useCallback((value, idx) => {
    const total = voteOptions.reduce(
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
      voteOptions[idx].sliderValue = value
      voteOptions[idx].trueValue = Math.round(value * 100)
      setRemaining(100 - total)
      setVoteOptions([...voteOptions])
    }
  }, [voteOptions])

  const handleVoteSubmit = useCallback(() => {
    const { userBalance } = tokenData
    let optionsArray = []

    voteOptions.forEach(element => {
      let voteWeight = element.trueValue
        ? Math.round(
          parseFloat(
            (element.trueValue * userBalance).toFixed(2)
          )
        )
        : 0
      optionsArray.push(voteWeight)
    })

    //re-proportion the supports values so they don't exceed the total balance
    const valueTotal = optionsArray.reduce((a, b) => a + b, 0)
    valueTotal > parseInt(userBalance)
      ? (optionsArray = optionsArray.map(
        tokenSupport =>
          (tokenSupport / valueTotal) *
          (parseInt(userBalance) * 0.9999)
      ))
      : 0
    onVote(voteId, optionsArray)
  }, [ voteId, onVote, tokenData, voteOptions ])

  const AppBadge = ({ type, youVoted }) => (
    <div
      css={`
        display: flex;
        justify-content: space-between;
        margin-bottom: ${2 * GU}px;
      `}
    >
      <GenerateBadge type={type} />
      {youVoted && (
        <div
          css={`
            display: inline-grid;
            grid-template-columns: auto auto;
            grid-gap: ${0.5 * GU}px;
            align-items: center;
            justify-content: center;
            height: 20px;
            width: auto;
            border-radius: 100px;
            padding: 0 ${1 * GU}px;
            background: ${theme.infoSurface.alpha(0.08)};
            color: ${theme.info};
            ${textStyle('label2')};
          `}
        >
          <IconCheck size="tiny" /> Voted
        </div>
      )}
    </div>
  )
  AppBadge.propTypes = {
    type: PropTypes.string.isRequired,
    youVoted: PropTypes.bool.isRequired,
  }

  const Title = ({ question }) => (
    <div
      css={`
        display: grid;
        grid-template-columns: auto;
        grid-gap: ${2.5 * GU}px;
        margin-top: ${2.5 * GU}px;
        margin-bottom: ${2 * GU}px;
      `}
    >
      <div
        css={`
          ${textStyle('title2')};
        `}
      >
        <strong>{question}</strong>
      </div>
    </div>
  )

  Title.propTypes = {
    question: PropTypes.string.isRequired,
  }

  const DescriptionAndCreator = ({ creator, question, description }) => (
    <div
      css={`
        display: grid;
        grid-template-columns: ${layoutName === 'large' ? 'auto auto' : 'auto'};
        grid-gap: ${layoutName === 'large' ? 5 * GU : 2.5 * GU}px;
        margin-bottom: ${2 * GU}px;
      `}
    >
      <div>
        <Label>
          Description
        </Label>
        <div>
          {question === description ? '' : description}
        </div>
      </div>
      <div>
        <Label>
          Created By
        </Label>
        <div css="display: flex; align-items: flex-start">
          <LocalIdentityBadge
            networkType={network.type}
            entity={creator}
            shorten={true}
          />
        </div>
      </div>
    </div>
  )

  DescriptionAndCreator.propTypes = {
    creator: PropTypes.string.isRequired,
    question: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }
  DescriptionAndCreator.defaultProps = {
    question: '',
    description: '',
  }

  const VotingResults = ({ vote, options, totalSupport, voteWeights }) => (
    <React.Fragment>
      <Label>
        Current Results
      </Label>
      <div>
        <VotingOptions
          options={options}
          totalSupport={totalSupport}
          color={`${theme.accent}`}
          voteWeights={voteWeights}
        />
      </div>
      {!vote.open && getVoteStatus(vote) === VOTE_STATUS_SUCCESSFUL && <VoteEnact vote={vote} />}
    </React.Fragment>
  )

  VotingResults.propTypes = {
    vote: PropTypes.object.isRequired,
    options: PropTypes.PropTypes.arrayOf(PropTypes.object).isRequired,
    totalSupport: PropTypes.number.isRequired,
    voteWeights: PropTypes.PropTypes.arrayOf(PropTypes.string).isRequired,
  }

  const ValueContainer = styled.div`
    box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.03);
    border-radius: 3px;
    width: 69px;
    height: 40px;
    border: 1px solid ${theme.surfaceIcon};
    padding-top: 0.5rem;
    text-align: center;
  `

  const SliderAndValueContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  `

  const CastVote = ({ options }) => (
    <div css="width: 100%">
      <div css="display: flex; justify-content: space-between">
        <Label>Your vote</Label>
        <Label>Percentage</Label>
      </div>

      {voteOptions.map((option, index) => (
        <div key={index}>
          <SliderAndValueContainer>
            <Text size="small" css="width: 100%">{options[index].label}</Text>
            <div css={`
              display: flex;
              margin: 0.5rem 0 1rem 0;
              justify-content: space-between;
              width: 100%;
            `}>
              <Slider
                value={option.sliderValue}
                onUpdate={value => sliderUpdate(value, index)}
              />
              <ValueContainer>
                {option.trueValue || 0}
              </ValueContainer>
            </div>
          </SliderAndValueContainer>
        </div>
      ))}

      <Text.Block
        size="small"
        color={`${theme.surfaceContentSecondary}`}

      >
        <span css="font-weight: bold; float: right">
          You have <span css={`color: ${theme.accent}`}>{remaining}</span> dots remaining
        </span>
      </Text.Block>

      <div css="display: flex; justify-content: flex-end; align-items: center; width: 100%">
        <Button onClick={toggleVotingMode}>
          Cancel
        </Button>
        <Button
          css="margin: 1rem 0 1rem 0.5rem"
          mode="strong"
          onClick={() => {
            handleVoteSubmit()
            toggleVotingMode()
          }}
        >
          Submit Vote
        </Button>
      </div>
    </div>
  )

  CastVote.propTypes = {
    options: PropTypes.PropTypes.arrayOf(PropTypes.object).isRequired,
  }

  const VoteEnact = () => (
    <div>
      <Button
        mode="strong"
        wide
        onClick={handleExecuteVote}
        css="margin: 10px 0"
      >
          Execute Vote
      </Button>
      <Info>
        The voting period is closed and the vote status is passed. <span css="font-weight: bold">Anyone</span> can now enact this vote to execute its action.
      </Info>
    </div>
  )

  const Participation = ({ participationPct, minParticipationPct }) => (
    <Box heading="Participation">
      <div css="margin-bottom: 10px">
        {Math.round(participationPct)}%{' '}
        <Text size="small" color={`${theme.surfaceContentSecondary}`}>
          ({minParticipationPct}% needed)
        </Text>
      </div>

      <Spring
        delay={500}
        config={springs.stiff}
        from={{ value: 0 }}
        to={{ value: participationPct / 100 }}
        native
      >
        {({ value }) => (
          <VotingOption
            valueSpring={value}
            color={`${theme.positive}`}
            value={value}
            threshold={minParticipationPct}
          />
        )}
      </Spring>
    </Box>
  )

  Participation.propTypes = {
    participationPct: PropTypes.number.isRequired,
    minParticipationPct: PropTypes.number.isRequired,
  }

  const PastDate = styled.time`
    font-size: 13px;
    color: #98a0a2;
    margin-top: 6px;
    display: block;
  `

  const Status = ({ vote }) => (
    <Box heading="Status">
      <div>
        <h2>
          {vote.open ? 'Time Remaining' : 'Status'}
        </h2>
        <div>
          {vote.open ? (
            <Countdown end={vote.endDate} />
          ) : (
            <React.Fragment>
              <VoteStatus
                vote={vote}
                support={support}
                tokenSupply={totalVoters}
              />
              <PastDate
                dateTime={format(vote.endDate, 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx')}
              >
                {format(vote.endDate, 'MMM DD YYYY HH:mm')}
              </PastDate>
            </React.Fragment>
          )}
        </div>
      </div>
    </Box>
  )

  Status.propTypes = {
    vote: PropTypes.object.isRequired,
  }

  let totalSupport = 0
  // eslint-disable-next-line react/prop-types
  options.forEach(option => {
    totalSupport = totalSupport + parseFloat(option.value, 10)
  })

  // eslint-disable-next-line react/prop-types
  const youVoted = voteWeights.length > 0

  return (
    <Split
      primary={
        <Box>
          <div css={`
            > :not(:last-child) {
              margin-bottom: ${3 * GU}px;
            }
          `}>
            <AppBadge
              type={type}
              youVoted={!!voteAmounts.length}
            />
            <Title
              question={question}
            />
            <DescriptionAndCreator
              creator={creator}
              question={question}
              description={description}
            />

            {!votingMode && vote.open && canIVote && (
              <Button mode="strong" onClick={toggleVotingMode}>
                {youVoted ? 'Change vote' : 'Vote'}
              </Button>
            )}

            {votingMode ? (
              <CastVote
                voteId={voteId}
                userBalance={tokenData.userBalance}
                options={options}
                onVote={onVote}
              />
            ) :(
              <VotingResults
                vote={vote}
                options={options}
                totalSupport={totalSupport}
                voteWeights={voteWeights}
              />
            )}
          </div>
        </Box>
      }
      secondary={
        <React.Fragment>
          <Participation participationPct={participationPct} minParticipationPct={minParticipationPct} />
          <Status vote={vote} />
        </React.Fragment>
      }
    />
  )
}

VoteDetails.propTypes = {
  app: PropTypes.object.isRequired,
  userAccount: PropTypes.string.isRequired,
  tokenContract: PropTypes.object.isRequired,
  vote: PropTypes.object.isRequired,
  onVote: PropTypes.func.isRequired,
  minParticipationPct: PropTypes.number.isRequired,
}

export default VoteDetails
