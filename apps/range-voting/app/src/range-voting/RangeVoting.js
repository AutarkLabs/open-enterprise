import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Motion, spring } from 'react-motion'
import { spring as springConf } from '@aragon/ui'

import close from '../assets/close.svg'

import * as Steps from './steps'
import Templates from './templates'

import StepsBar from '../components/StepsBar'
import PrevNext from '../components/PrevNext'

import Template from './Template'
import Review from './Review'
import Launch from './Launch'

import { noop } from '../utils/utils'

import tokenBalanceOfAbi from './abi/token-balanceof.json'
import tokenDecimalsAbi from './abi/token-decimals.json'

import { hasLoadedVoteSettings } from './vote-settings'

const tokenAbi = [].concat(tokenBalanceOfAbi, tokenDecimalsAbi)

const SPRING_SHOW = {
  stiffness: 120,
  damping: 17,
  precision: 0.001,
}
const SPRING_HIDE = {
  stiffness: 70,
  damping: 15,
  precision: 0.001,
}
const SPRING_SCREEN = springConf('slow')

class RangeVoting extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
    handleClose: PropTypes.func.isRequired
  }
  static defaultProps = {
    account: '',
    balance: null,
    network: '',
    visible: true,
    walletWeb3: null,
    web3: null,
    connected: false,
    contractCreationStatus: 'none',
    onComplete: noop,
    onCreateContract: noop,
  }
  constructor(props) {
    super(props)
    this.state = {
      template: null,
      templateData: {},
      stepIndex: 0,
      direction: 1,
      createVoteVisible: false,
      currentVoteId: -1,
      settingsLoaded: false,
      tokenContract: this.getTokenContract(props.tokenAddress),
      voteVisible: false,
      voteSidebarOpened: false,
    }
  }
  getTokenContract(tokenAddress) {
    return tokenAddress && this.props.app.external(tokenAddress, tokenAbi)
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { settingsLoaded } = this.state
    const { props } = this

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

    if (nextProps.visible && !props.visible) {
      this.setState({ stepIndex: 0 })
    }
  }

  getSteps() {
    const { template } = this.state

    const configureSteps = Templates.has(template)
      ? Templates.get(template).screens.map(step => ({
          ...step,
          group: Steps.Configure,
        }))
      : []

    return [
      { screen: 'template', group: Steps.Template },
      ...configureSteps,
      { screen: 'review', group: Steps.Review },
      { screen: 'launch', group: Steps.Launch },
    ]
  }

  currentStep() {
    const { stepIndex } = this.state
    const steps = this.getSteps()
    return steps[stepIndex] || { group: Steps.Template }
  }

  getInitialDataFromTemplate(template) {
    if (!Templates.has(template)) {
      return []
    }
    const fields = Templates.get(template).fields
    return Object.entries(fields).reduce(
      (fields, [name, { defaultValue }]) => ({
        ...fields,
        [name]: defaultValue(),
      }),
      {}
    )
  }

  getTemplateScreen(template, screen) {
    if (!Templates.has(template)) {
      return null
    }
    return (
      Templates.get(template).screens.find(
        screenData => screenData.screen === screen
      ) || null
    )
  }

  filterConfigurationValue(template, name, value) {
    if (!Templates.has(template)) {
      return null
    }
    return Templates.get(template).fields[name].filter(
      value,
      this.state.templateData
    )
  }

  validateConfigurationScreen(template, screen) {
    const screenData = this.getTemplateScreen(template, screen)
    return screenData ? screenData.validate(this.state.templateData) : false
  }

  handleConfigurationFieldUpdate = (name, value) => {
    this.setState(({ templateData, template }) => {
      const updatedFields = this.filterConfigurationValue(template, name, value)
      // If the filter returns null, the value is not updated
      if (updatedFields === null) {
        return {}
      }

      return {
        templateData: {
          ...templateData,
          ...updatedFields,
        },
      }
    })
  }

  handleTemplateSelect = (template = null) => {
    this.setState({
      template,
      templateData: this.getInitialDataFromTemplate(template),
    })
  }

  prepareReview = () => {
    const { template } = this.state

    if (!Templates.has(template)) {
      return null
    }

    const templateData = Templates.get(template)
    return templateData.prepareData(this.state.templateData)
  }

  createContract = () => {
    const { template } = this.state

    if (!Templates.has(template)) {
      return null
    }

    const templateData = Templates.get(template)
    const data = templateData.prepareData(this.state.templateData)

    console.log('onCreateContract ', data)
    this.props.onCreateContract(templateData.name, data)
  }

  moveStep = (direction = 1) => {
    const { stepIndex } = this.state
    const steps = this.getSteps()
    const newStepIndex = stepIndex + direction
    if (newStepIndex > steps.length - 1 || newStepIndex < 0) {
      return
    }

    if (steps[newStepIndex].screen === 'review') {
      this.createContract()
    }

    this.setState({ stepIndex: newStepIndex, direction })
  }
  nextStep = () => {
    if (this.isNextEnabled()) {
      this.moveStep(1)
    }
  }
  prevStep = () => {
    if (this.isPrevEnabled()) {
      this.moveStep(-1)
    }
  }
  isPrevEnabled() {
    return true
  }
  isNextEnabled() {
    const { template } = this.state
    const step = this.currentStep()
    if (step.screen === 'template') {
      return !!template
    }
    if (step.group === Steps.Configure) {
      return this.validateConfigurationScreen(template, step.screen)
    }
    return true
  }

  isPrevNextVisible() {
    const step = this.currentStep()
    return (
      step.group !== Steps.Launch
    )
  }
  isLaunchingNext() {
    const { stepIndex } = this.state
    const steps = this.getSteps()
    return steps[stepIndex + 1] && steps[stepIndex + 1].screen === 'launch'
  }

  render () {
    const { direction, stepIndex } = this.state
    const { visible } = this.props
    const step = this.currentStep()
    const steps = this.getSteps()

    return (
      <Motion
        style={{
          showProgress: spring(
            Number(visible),
            visible ? SPRING_SHOW : SPRING_HIDE
          ),
        }}
      >
        {({ showProgress }) => (
          <Main
            style={{
              transform: visible
                ? 'none'
                : `translateY(${100 * (1 - showProgress)}%)`,
              opacity: visible ? showProgress : 1,
            }}
          >
            <View>
              <Window>
                <RangeWizardCloseButton
                  type="button"
                  onClick={this.props.handleClose}
                >
                  <img src={close} alt="Close" />
                </RangeWizardCloseButton>

                <Motion
                  style={{ screenProgress: spring(stepIndex, SPRING_SCREEN) }}
                >
                  {({ screenProgress }) => (
                    <React.Fragment>
                      <StepsBar activeGroup={step.group} />
                      <div>
                        {steps.map(({ screen }, i) => (
                          <Screen active={screen === step.screen} key={screen}>
                            {this.renderScreen(
                              screen,
                              i - stepIndex,
                              i - screenProgress,
                              step.screen,
                            )}
                          </Screen>
                        ))}
                      </div>
                      <PrevNext
                        visible={this.isPrevNextVisible()}
                        direction={direction}
                        onPrev={this.prevStep}
                        onNext={this.nextStep}
                        enableNext={this.isNextEnabled()}
                        enablePrev={this.isPrevEnabled()}
                        isLaunchingNext={this.isLaunchingNext()}
                      />
                    </React.Fragment>
                  )}
                </Motion>
              </Window>
            </View>
          </Main>
        )}
      </Motion>
    )
  }


  renderScreen(screen, position, positionProgress, activeScreen) {
    const {
      template
    } = this.state

    const {
      //account,
      //network,
      //balance,
      onComplete,
    } = this.props

    positionProgress = Math.min(1, Math.max(-1, positionProgress))
    const warm = Math.abs(position) <= 1
    const sharedProps = { positionProgress, warm }
    if (screen === 'template') {
      return (
        <Template
          templates={Templates}
          activeTemplate={template}
          onSelect={this.handleTemplateSelect}
          {...sharedProps}
        />
      )
    }
    const configurationData = this.prepareReview()
    if (screen === 'review') {
      return <Review
        onConfirm={onComplete}
        configurationData={configurationData}
        {...sharedProps}
      />
    }
    if (screen === 'launch') {
      const active = activeScreen === 'launch'
      return <Launch
        app={this.props.app}
        onConfirm={onComplete}
        configurationData={configurationData}
        active={active}
        {...sharedProps}
      />
    }
    const steps = this.getSteps()
    const configureScreen = steps.find(
      step => step.screen === screen && step.group === Steps.Configure
    )
    if (!configureScreen) {
      return null
    }

    const ConfigureScreen = configureScreen.Component
    const fields = this.state.templateData
    return (
      <ConfigureScreen
        screen={screen}
        fields={fields}
        onFieldUpdate={this.handleConfigurationFieldUpdate}
        onSubmit={this.nextStep}
        {...sharedProps}
      />
    )
  }
}
const Main = styled.div`
  position: fixed;
  z-index: 2;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: auto;
  height: 100vh;
  background-color: rgba(40, 40, 40, 0.4);
`

const View = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 800px;
  min-height: 100%;
  padding: 50px;
`

const Window = styled.div`
  position: relative;
  width: 1080px;
  height: 660px;
  background: #fff;
  border-radius: 3px;
  box-shadow: 0 10px 28px 0 rgba(90, 90, 90, 0.7);
`

const Screen = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: ${({ active }) => (active ? 'auto' : 'none')};
`

const RangeWizardCloseButton = styled.button`
  ${Window} & {
    position: absolute;
    padding: 20px;
    top: 0;
    right: 0;
    cursor: pointer;
    background: none;
    border: 0;
    outline: 0;
    z-index:3;
    &::-moz-focus-inner {
      border: 0;
    }
  }
`

export default RangeVoting;
