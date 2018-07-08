import React from 'react'
import styled from 'styled-components'
import { theme, Text, Button } from '@aragon/ui'
import { lerp } from '../utils/math-utils'
import { Main, Content, Title } from '../style'
import { addTool } from '../stores/ToolStore'

import imgPending from '../assets/transaction-pending.svg'
import imgSuccess from '../assets/transaction-success.svg'
import imgError from '../assets/transaction-error.svg'

class Launch extends React.Component {
  static defaultProps = {
    warm: false,
    positionProgress: 0,
  }
  constructor(props) {
    super(props)
    this.state = {
      active: false,
      contractCreationStatus: 'none',
    }
  }
  componentWillReceiveProps(nextProps) {
    const { active, app, configurationData } = nextProps
    // Hacky way to only initialize once
    if (active && !this.state.active) {
      this.state.active = true
      app.initialize(
        "0xffffffffffffffffffffffffffffffffffffffff",
        configurationData.supportNeeded * 10**16,
        configurationData.minAcceptanceQuorum * 10**16,
        configurationData.voteDuration * 60 * 60,
      ).subscribe(
        (data) => {
          if (data) {
            this.setState({ contractCreationStatus: 'success' })
            addTool({
              label: 'Monthly Reward DAO',
              description: 'Allocate our monthly reward DAO accross four circles: Governance, Dapp, Social Coding, and Comms',
              address: '0x45f3...5567',
              stats: [
                  {label: 'BALANCE', value: '10 ETH' },
                  {label: 'BUDGET', value: '5 ETH / Month'}
              ]
            })
          } else {
            this.setState({ contractCreationStatus: 'error' })
          }
        }
      )
    }
  }
  handleTemplateSelect = template => {
    this.props.onSelect(template)
  }
  render() {
    const {
      active,
      app,
      configurationData,
      positionProgress,
      warm,
      onTryAgain,
    } = this.props
    const { contractCreationStatus } = this.state

    return (
      <Main>
        <Content
          style={{
            transform: `translateX(${lerp(positionProgress, 0, 50)}%)`,
            opacity: 1 - Math.abs(positionProgress),
            willChange: warm ? 'opacity, transform' : 'auto',
          }}
        >
          <SignContent
            contractCreationStatus={contractCreationStatus}
            onTryAgain={onTryAgain}
          />
        </Content>
      </Main>
    )
  }
}

class SignContent extends React.PureComponent {
  render() {
    const { contractCreationStatus, onTryAgain, app } = this.props

    return (
      <React.Fragment>
        <Title>
          <Text size="great" weight="bold" color={theme.textDimmed}>
            Sign transactions
          </Text>
        </Title>

        <p>
          <Text size="large" color={theme.textSecondary}>
            Your wallet should open and you need to sign the transaction to initialize range voting.
          </Text>
        </p>

        <Transactions>
          {/* <Transaction>
            <TransactionTitle>
              <Text weight="bold" color={theme.textSecondary} smallcaps>
                Token creation
              </Text>
            </TransactionTitle>
            {this.renderTxStatus(contractCreationStatus)}
          </Transaction> */}
          <Transaction>
            <TransactionTitle>
              <Text weight="bold" color={theme.textSecondary} smallcaps>
                Initializing...
              </Text>
            </TransactionTitle>
            {this.renderTxStatus(contractCreationStatus)}
          </Transaction>
        </Transactions>

        {contractCreationStatus === 'error' && (
          <TryAgain>
            <Button mode="outline" compact onClick={onTryAgain}>
              Try Again
            </Button>
          </TryAgain>
        )}

        {contractCreationStatus === 'none' && (
          <Note>
            <Text size="xsmall" color={theme.textSecondary}>
              It might take some time before these transactions get processed,
              depending on the status of the network. Please be patient and do
              not close this page until it finishes.
            </Text>
          </Note>
        )}
      </React.Fragment>
    )
  }
  renderTxStatus(contractCreationStatus) {
    if (contractCreationStatus === 'error') return <TxFailure />
    if (contractCreationStatus === 'success') return <TxSuccess />
    return <TxPending />
  }
}
const TxSuccess = () => (
  <StyledTx>
    <TxIconWrapper>
      <img src={imgSuccess} alt="" />
    </TxIconWrapper>
    <p>
      <Text size="xsmall">Successful transaction.</Text>
    </p>
  </StyledTx>
)

const TxFailure = () => (
  <StyledTx>
    <TxIconWrapper>
      <img src={imgError} alt="" />
    </TxIconWrapper>
    <p>
      <Text color={theme.negative} size="xsmall">
        Error with the transaction.
      </Text>
    </p>
  </StyledTx>
)

const TxPending = () => (
  <StyledTx>
    <TxIconWrapper>
      <img src={imgPending} alt="" />
    </TxIconWrapper>
    <p>
      <Text size="xsmall">Waiting…</Text>
    </p>
  </StyledTx>
)

const TxIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
`

const StyledTx = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 30px;
  p {
    margin-top: 30px;
    white-space: nowrap;
  }
`
const Transactions = styled.div`
  display: flex;
  margin-top: 60px;
  text-align: center;
`

const Transaction = styled.div`
  width: 145px;
`

const TransactionTitle = styled.h2`
  white-space: nowrap;
`

const Note = styled.p`
  max-width: 55%;
  margin-top: 40px;
  text-align: center;
`

const TryAgain = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 50px;
`

export default Launch

