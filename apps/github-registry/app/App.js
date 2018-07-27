import React, { Component, PureComponent } from 'react'
import { hot } from 'react-hot-loader'
import { AragonApp, Text, theme } from '@aragon/ui'
import styled from 'styled-components'
import { GithubProvider } from './context/GithubContext'

import { Issues, Overview, Settings } from './screens'

class TabbedView extends PureComponent {
  state = {
    activeIndex: 0,
  }

  selectTabIndex(activeIndex) {
    this.setState({ activeIndex })
  }

  render() {
    const children = React.Children.map(this.props.children, child => {
      return React.cloneElement(child, {
        activeIndex: this.state.activeIndex,
        onSelectTab: this.selectTabIndex.bind(this),
      })
    })
    return <StyledTabbedView>{children}</StyledTabbedView>
  }
}

class ScreenView extends PureComponent {
  render() {
    const { activeIndex } = this.props
    return (
      <StyledScreenView>{this.props.children[activeIndex]}</StyledScreenView>
    )
  }
}

const AppTitle = () => <StyledTitle size="xxlarge">Planning</StyledTitle>
const TabBar = props => {
  const { activeIndex } = props
  const children = React.Children.map(props.children, (child, index) => {
    return React.cloneElement(child, {
      isActive: index === activeIndex,
      onSelect: () => props.onSelectTab(index),
    })
  })
  return <StyledTabBar>{children}</StyledTabBar>
}
const Tab = props => {
  const { isActive, onSelect } = props
  return (
    <StyledTab className={isActive && 'active'} onClick={onSelect}>
      <Text>{props.children}</Text>
    </StyledTab>
  )
}
const ActiveIndicator = () => <StyledIndicator />

// STYLES
const StyledTitle = styled(Text)`
  position: relative;
  z-index: 1;
  display: block;
  padding-left: 30px;
  line-height: 63px;
  background: ${theme.contentBackground};
  box-shadow: rgba(0, 0, 0, 0.1) 1px 0 15px;
  overflow: visible;
  border-bottom: 1px solid ${theme.contentBorder};
`
const StyledTabbedView = styled.div`
  position: absolute;
  height: calc(100% - 63px);
  width: 100%;
  display: flex;
  flex-direction: column;
`
// Meter un spring motion desde top a la barra de tabs y un opacity a la screenview
// Crear igual que unselected pero para sombras
// ojo con las sombras material on hover
const StyledTabBar = styled.nav`
  line-height: 31px;
  padding-left: 30px;
  background: ${theme.contentBackground};
  border-bottom: 1px solid ${theme.contentBorder};
  ${'' /* box-shadow: 1px 0 15px rgba(0, 0, 0, 0.1); */} ${'' /* box-shadow: inset 0 1px 15px 0px rgba(0,0,0,0.1); */};
`

// Falta el hover, el active, etc
const StyledTab = styled.div`
  padding-top: 4px;
  display: inline-block;
  cursor: pointer;
  height: 37px;
  margin-right: 50px;
  transition: all 0.5s cubic-bezier(0.38, 0.8, 0.32, 1.07);
  &.active {
    cursor: default;
    text-shadow: 0.1px 0 0 ${theme.textPrimary}, -0.1px 0 0 ${theme.textPrimary};
    border-bottom: 4px solid ${theme.accent}};
  }
  &:hover:not(.active) {
    color: ${theme.textSecondary};
  }
`
const StyledIndicator = styled.div`
  // position: relative;
  // bottom: 0;
  // height: 4px;
  // width: 65px;
  // background: ${theme.accent};
`
const StyledScreenView = styled.main`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px;
  overflow: auto;
  flex-grow: 1;

  // /* position: static;
  // display: flex;
  // padding: 30px;
  // overflow: auto;
  // align-items: center;
  // justify-content: center;
  // background: red; */
`
// NOTES
// We need essentially those elements, then wrap the whole app into a context HOC wrapper

// Indicator toma refs con fordward refs //Habrá que pasarle una ref al elemento que es el active index

// meter el scrollwrapper en screenview

// usar render props para pasar active index
// para el bbotón: https://reactjs.org/docs/forwarding-refs.html guardando ref en el estado y que sea "active index"

// 01 tabbed view pasa props a tabbar: {activeIndex} y screenview: {activeIndex}
// 02 appbar necesita {activeindex} para el buttonbarr (o recogerlo con context directamente en el buttonbar con context)
// 03 quitar appview

// HOC PROVIDERS
// export default withContext(App)
// UIContext = {appTitle, appStyles (themes, etc) => importa aragon/ui }

const tabData = [
  {
    screen: Overview,
    button: { label: 'Add Project', actions: ['sidePanelOpen'] },
    sidePanelContent: 'NewProject',
    sidePanelTitle: 'New Project',
  },
  {
    screen: Issues,
    button: { label: 'New Issue', actions: ['createIssue'] },
  },
  { screen: Settings },
]

const getTabTitle = screen => screen.name.split(/(?=[A-Z])/).join(' ')

// const findTab = tabName => tabs.find(e => getTabTitle(e.screen) === tabName)

// const getTabTitles = tabData.map(({ screen }) => getTabTitle(screen))
const githubData = {
  authToken: '',
  login: '',
  avatarUrl: '',
  isAuthenticated: 'true',
  activeRepo: '',
  activeLabel: '',
  activeMilestone: '',
  reposToAdd: {},
  reposFromServer: {},
  reposManaged: {}, // to be populated from contract or git backend itself,
  err: '',
  //    reposManaged: getPreprocessedRepos(), // to be populated from contract or git backend itself
}
class App extends Component {
  render() {
    return (
      <AragonApp backgroundLogo publicUrl="aragon-ui-assets/">
        <GithubProvider>
          <AppTitle />
          <TabbedView>
            <TabBar>
              {tabData.map(({ screen }) => (
                <Tab key={getTabTitle(screen)}>{getTabTitle(screen)}</Tab>
              ))}
              <ActiveIndicator />
            </TabBar>
            <ScreenView>
              {tabData.map(({ screen: Screen }) => (
                <Screen key={getTabTitle(Screen)} github={githubData} />
              ))}
            </ScreenView>
          </TabbedView>
        </GithubProvider>
      </AragonApp>
    )
  }
}

export default hot(module)(App)
