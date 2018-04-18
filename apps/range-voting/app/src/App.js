import React from 'react'
import styled from 'styled-components'
import { Motion, spring } from 'react-motion'
import { spring as springConf } from '@aragon/ui'
import {AragonApp, AppBar} from '@aragon/ui'

import LoginButton from './components/LoginButton'

import * as Steps from './steps'
import Templates from './templates'

import StepsBar from './StepsBar'
import PrevNext from './PrevNext'

import Template from './Template'
import Review from './Review'
import Launch from './Launch'

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

const initialState = {
  template: null,
  templateData: {},
  stepIndex: 0,
  direction: 1
}

class App extends React.Component {
  static defaultProps = {
    account: '',
    balance: null,
    network: '',
    visible: true,
  }
  state = {
    ...initialState,
  }

  componentWillReceiveProps(nextProps) {
    const { props } = this

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

  handleConfigurationFieldUpdate = (screen, name, value) => {
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

  moveStep = (direction = 1) => {
    const { stepIndex } = this.state
    const steps = this.getSteps()
    const newStepIndex = stepIndex + direction
    if (newStepIndex > steps.length - 1 || newStepIndex < 0) {
      return
    }

    if (steps[newStepIndex].screen === 'launch') {
      this.buildDao()
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
    return steps[stepIndex + 1] && steps[stepIndex + 1].name === 'launch'
  }

  
  render () {
    const { direction, stepIndex } = this.state
    const { visible } = this.props
    const step = this.currentStep()
    const steps = this.getSteps()

    return (
      <AragonApp backgroundLogo={true}>
        <AppBar title="Range Voting" endContent={<LoginButton />}/>
      
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
                              i - screenProgress
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
                        launchingNext={this.isLaunchingNext()}
                      />
                    </React.Fragment>
                  )}
                </Motion>
              </Window>
            </View>
          </Main>
        )}
      </Motion>
 



      </AragonApp>
    )
  }


  renderScreen(screen, position, positionProgress) {
    const {
      template
    } = this.state

    const {
      account,
      network,
      balance,
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
    if (screen === 'review') {
      return <Review onConfirm={onComplete} {...sharedProps} />
    }
    if (screen === 'launch') {
      return <Launch onConfirm={onComplete} {...sharedProps} />
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
  background-image: linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.08) 0%,
      rgba(0, 0, 0, 0.08) 100%
    ),
    linear-gradient(-226deg, #00f1e1 0%, #00b4e4 100%);
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
  box-shadow: 0 10px 28px 0 rgba(11, 103, 157, 0.7);
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



export default App;
