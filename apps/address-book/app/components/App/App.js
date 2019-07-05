import { observe, SidePanel, Main, AppBar, AppView } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import Entities from './Entities'
import NewEntity from '../Panel/NewEntity'
import { networkContextType, AppTitle, AppTitleButton } from '../../../../../shared/ui'
import { useAragonApi } from '@aragon/api-react'
import { IdentityProvider } from '../../../../../shared/identity'

class App extends React.Component {
  static propTypes = {
    api: PropTypes.object,
    entities: PropTypes.arrayOf(PropTypes.object),
  }

  static defaultProps = {
    network: {},
  }

  static childContextTypes = {
    network: networkContextType,
  }

  state = {
    panelVisible: false,
  }

  getChildContext() {
    const { network } = this.props
    return {
      network: {
        type: network.type,
      },
    }
  }

  createEntity = entity => {
    this.props.api.addEntry(entity.address, entity.name, entity.type)
    this.closePanel()
  }

  removeEntity = address => {
    this.props.api.removeEntry(address)
  }

  newEntity = () => {
    this.setState({
      panelVisible: true,
    })
  }

  closePanel = () => {
    this.setState({ panelVisible: false })
  }

  handleResolveLocalIdentity = address => {
    return this.props.api.resolveAddressIdentity(address).toPromise()
  }

  handleShowLocalIdentityModal = address => {
    return this.props.api
      .requestAddressIdentityModification(address)
      .toPromise()
  }

  render() {
    const { panelVisible } = this.state
    const { entries, displayMenuButton = false } = this.props

    return (
      <Main>
        <IdentityProvider
          onResolve={this.handleResolveLocalIdentity}
          onShowLocalIdentityModal={this.handleShowLocalIdentityModal}>
          <AppView
            appBar={
              <AppBar
                endContent={
                  <AppTitleButton
                    caption="New Entity"
                    onClick={this.newEntity}
                  />
                }
              >
                <AppTitle
                  title="Address Book"
                  displayMenuButton={displayMenuButton}
                  css="padding-left: 30px"
                />
              </AppBar>
            }
          >

            <ScrollWrapper>
              <Entities
                entities={entries ? entries : []}
                onNewEntity={this.newEntity}
                onRemoveEntity={this.removeEntity}
              />
            </ScrollWrapper>

          </AppView>

          <SidePanel
            title="New entity"
            opened={panelVisible}
            onClose={this.closePanel}
          >
            <NewEntity onCreateEntity={this.createEntity} />
          </SidePanel>
        </IdentityProvider>
      </Main>
    )
  }
}

const ScrollWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  overflow: auto;
  flex-grow: 1;
`
export default () => {
  const { api, appState, displayMenuButton } = useAragonApi()
  return <App api={api} {...appState} displayMenuButton={displayMenuButton} />
}
