import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import Aragon, { providers } from '@aragon/client'

import { theme } from '@aragon/ui'
import { AragonApp, AppBar, Button, SidePanel } from '@aragon/ui'
import AppLayout from './components/AppLayout'
import Overview from './screens/Overview'
import Tools from './screens/Tools'
import Issues from './screens/Issues'
import Decisions from './screens/Decisions'
import AddressBook from './screens/AddressBook'
import Settings from './screens/Settings'
import { noop } from './utils/utils'
import { networkContextType } from './utils/provideNetwork'
import {
    NewProjectPanelContent,
    NewIssuePanelContent
} from './components/Panels'
import PayoutEngine from './payout-engine/PayoutEngine'

// quick and dirty way of populating issues and repos from a snapshot of few public repos
//import getPreprocessedRepos from './github.repos'

const initialState = {
  template: null,
  templateData: {},
  stepIndex: 0,
  activeTabId: 0,
  createProjectVisible: false,
  createIssueVisible: false,
  rangeWizardActive: false,
  github: {
    isAuthenticated: false,
    login: '',
    avatarUrl: '',
    activeRepo: '',
    activeLabel: '',
    activeMilestone: '',
    authToken: '',
    reposManaged: {}, // to be populated from contract or git backend itself
//    reposManaged: getPreprocessedRepos(), // to be populated from contract or git backend itself
  }
}

export default class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
  }

  static defaultProps = {
    network: {
      etherscanBaseUrl: 'https://rinkeby.etherscan.io',
      name: 'rinkeby',
    },
    tabs: [
      { id: 0, name: 'Overview', screen: Overview, barButton: { title: 'Add Project', handlerVar: 'createProjectVisible' }},
      { id: 1, name: 'Decisions', screen: Decisions, barSelectButton: { title: 'Actions', items: ['one', 'two', 'three'] }},
      { id: 2, name: 'Issues', screen: Issues, barButton: { title: 'New Issue', handlerVar: 'createIssueVisible' }},
      { id: 3, name: 'Tools', screen: Tools, barButton: { title: 'New Tool', handlerVar: 'rangeWizardActive' }},
      { id: 4, name: 'Address Book', screen: AddressBook },
      { id: 5, name: 'Settings', screen: Settings },
    ]
  }

  constructor(props) {
    super(props)
    this.state = {
      ...initialState
    }
  }

  handleGitHubAuth = (authToken, login, avatarUrl) => {
    // probably unnecessarily explicit
    // meant to be called from NewProjectPanelContent after successful whoami query
    const { github } = this.state
    github.authToken = authToken
    github.login = login
    github.avatarUrl = avatarUrl
    github.isAuthenticated = true
    github.activeRepo = ''
    this.setState({ github: github })
  }

  // <App> needs to know what repo is selected, because selection matters on multiple screens
  handleRepoSelect = repoId =>  {
    //console.log('top handleRepoSelect: ' + repoId)
    const { github } = this.state
    github.activeRepo = repoId
    this.setState({
      github: github,
      activeTabId: 2 // because selecting a repo shows Issues
    })
  }

  // removing repos is triggered from Tools tab
  handleRepoRemove = repoId =>  {
    const { github } = this.state
    if (github.activeRepo === repoId) {
      github.activeRepo = ''
    }
    delete github.reposManaged[repoId]
    this.setState({
      github: github
    })
  }

   // this probably needs to be limited to Issues screen
   handleLabelSelect = labelName =>  {
    const { github } = this.state
    github.activeLabelName = labelName
    this.setState({ github: github })
  }

   handleMilestoneSelect = milestoneName =>  {
    const { github } = this.state
    github.activeMilestoneName = milestoneName
    this.setState({ github: github })
  }

  handleAddRepos = (reposToAdd) => {
    const { github } = this.state

    Object.keys(reposToAdd).forEach((repoId) => {
      var repo = reposToAdd[repoId]
      if (repoId in github.reposManaged) {
        console.log('already in: ' + repo.name)
      } else {
        console.log('adding: ' + repo.name)
        github.reposManaged[repoId] = repo
      }
    })

    this.setState({
      createProjectVisible: false,
      activeTabId: 0, // show Overview
      github: github
    })
  }

  handleTabClick = (id) => {
    return () => {
      this.setState({
        activeTabId: id
      })
    }
  }

  handleCreateIssueClose = () => {
    this.setState({ createIssueVisible: false })
  }
  generateSidePanelHandlerOpen = (handlerVar) => {
    return () => {
      this.setState({ [handlerVar]: true })
    }
  }
  handleRangeWizardClose = () => {
    this.setState({ rangeWizardActive: false })
  }
  handleCreateProjectClose = () => {
    this.setState({ createProjectVisible: false })
  }
  handleCreateProject = () => {
    const {name, description, repoURL, bountySystem} = this.state
    alert ('creating: ' + name + ', ' + description + ', ' + repoURL + ', ' + bountySystem)
  }

  handleRangeWizardLaunch = tool => {
    const { tools } = this.state
    tools.push(tool)
    this.setState({ tools: tools })

    this.handleRangeWizardClose()
  }

  render () {
    const { tabs } = this.props
    const { activeTabId, createProjectVisible, createIssueVisible, github, tools } = this.state
    const Screen = tabs[activeTabId].screen
    var newItemHandler = null
    var barButton = null

    // trigger change in bool variable, which is enough to make associated SidePanel show up
    if ('barButton' in tabs[activeTabId]) {
      newItemHandler = this.generateSidePanelHandlerOpen(tabs[activeTabId].barButton.handlerVar)
      barButton = (
        <Button mode="strong" onClick={newItemHandler}>
          {tabs[activeTabId].barButton.title}
        </Button>
      )
    }

    //
    if ('barSelectButton' in tabs[activeTabId]) {
      barButton = (
        <DropDownButton>
          <Button mode="strong">
            {tabs[activeTabId].barSelectButton.title}
          </Button>
          <DropDownContent>
          {
            tabs[activeTabId].barSelectButton.items.map((item) => {
              return (
               <div key={item}>{item}</div>
              )
            })
          }
          </DropDownContent>
        </DropDownButton>
      )
    }

    return (
      <AragonApp publicUrl="/aragon-ui/">
        <AppLayout>
          <AppLayout.Header>
            <AppBar
              title="Planning"
              endContent={barButton}
            />
          </AppLayout.Header>
          <Tabs>{
            tabs.map (({id, name}) => (
              <Tab
                active={id === activeTabId}
                onClick={this.handleTabClick(id)}
                key={id}
              >{name}</Tab>
            ))}
          </Tabs>
          <AppLayout.ScrollWrapper>
            <AppLayout.Content>
               <Screen
                  app={this.props.app}
                  onActivate={newItemHandler}
                  github={github}
                  tools={tools}
                  onSelect={this.handleRepoSelect}
                  onRemove={this.handleRepoRemove}
                  handleLabelSelect={this.handleLabelSelect}
                  handleMilestoneSelect={this.handleMilestoneSelect}
               />
            </AppLayout.Content>
          </AppLayout.ScrollWrapper>
        </AppLayout>
        {/*
          SidePanels should live in appropriate screen, but screen is a component one
          level down and in order to communicate with <App> (where data is stored)
          they need to be given multiple callbacks in props - easier to keep them all here.
        */}
        <SidePanel
          title="Add Project"
          opened={createProjectVisible}
          onClose={this.handleCreateProjectClose}
        >
          <NewProjectPanelContent
            opened={createProjectVisible}
            onCreateProject={this.handleCreateProject}
            onHandleAddRepos={this.handleAddRepos.bind(this)}
            onHandleGitHubAuth={this.handleGitHubAuth}
            github={github}
          />
        </SidePanel>

        <SidePanel
          title="New Issue"
          opened={createIssueVisible}
          onClose={this.handleCreateIssueClose}
        >
          <NewIssuePanelContent
            opened={createIssueVisible}
            onCreateIssue={this.handleCreateIssue}
            onHandleGitHubAuth={this.handleGitHubAuth}
            github={github}
          />
        </SidePanel>

      { this.state.rangeWizardActive && (
        <PayoutEngine
          visible={true}
          app={this.props.app}
          handleClose={this.handleRangeWizardClose}
          handleLaunch={this.handleRangeWizardLaunch}
        />
      )}
      </AragonApp>
    )
  }
}

const Tabs = styled.div`
  background-color: #FFF;
  width: 100%;
  line-height: 40px;
  border-bottom: 1px solid #e8e8e8;
`
const Tab = styled.div`
  font-size: '13px';
  margin-left: 20px;
  display: inline-block;
  cursor: pointer;
  font-weight: ${({ active }) => (active ? '800' : '400')};
  border-bottom: ${({ active }) => (active ? '4px solid ' + theme.accent : '0px')};
`
const DropDownContent = styled.div`
  display: none;
  position: absolute;
  background-color: #f1f1f1;
  min-width: 160px;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
  z-index: 1;
`
const DropDownButton = styled.div`
  position: relative;
  display: inline-block;
  &:hover ${DropDownContent} {
    display: block;
  }
`/*
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
*/
