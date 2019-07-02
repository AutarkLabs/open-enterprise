import {
  observe,
  SidePanel,
  Main,
  AppBar,
  AppView,
  font,
  breakpoint,
  Button,
} from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import { hot } from 'react-hot-loader'
import styled from 'styled-components'
import { map } from 'rxjs/operators'
import Entities from './Entities'
import NewEntity from '../Panel/NewEntity'
import {
  networkContextType,
  AppTitle,
  AppTitleButton,
} from '../../../../../shared/ui'
import DiscussionsApi from '../../../../discussions/app/modules/DiscussionsApi'

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
    // TODO: Shape this
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
    this.props.app.addEntry(entity.address, entity.name, entity.type)
    this.closePanel()
  }

  removeEntity = address => {
    this.props.app.removeEntry(address)
  }

  newEntity = () => {
    this.setState({
      panelVisible: true,
    })
  }

  closePanel = () => {
    this.setState({ panelVisible: false })
  }

  render() {
    const { panelVisible } = this.state
    const { entries, displayMenuButton = false } = this.props

    return (
      <Main>
        <AppView
          padding={0}
          appBar={
            <AppBar
              endContent={
                <AppTitleButton caption="New Entity" onClick={this.newEntity} />
              }
            >
              <AppTitle
                title="Address Book"
                displayMenuButton={displayMenuButton}
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
            {/* <Button onClick={() => {
              this.props.app.getApps().subscribe(async apps => {
                const { abi, proxyAddress } = apps.find(app => app.name === 'Discussions')
                const contract = this.props.app.external(proxyAddress, abi)
                await contract.post('123', 'abc').toPromise()
              })
            }}>Post a discussion</Button>
            <Button onClick={() => {
              this.props.app.getApps().subscribe(async apps => {
                const { abi, proxyAddress } = apps.find(app => app.name === 'Discussions')
                const contract = this.props.app.external(proxyAddress, abi)
                console.log('HERE')
                contract.pastEvents().subscribe(events => {
                  console.log('HELLOOOOO', events)
                })
              })
            }}>Get discussion events</Button>
            <Button onClick={async () => {
              this.props.app.getForwardedActions().subscribe(events => console.log('made it here', events))
            }}>Get my discussion threads</Button> */}
            <Button
              onClick={async () => {
                const discussions = new DiscussionsApi(this.props.app)
                await discussions.init()
                // const discussionData = await discussions.collect()
                // console.log(discussionData, 'DISCUSSION DATA')
              }}
            >
              Do the thing!
            </Button>
          </ScrollWrapper>
        </AppView>

        <SidePanel
          title="New entity"
          opened={panelVisible}
          onClose={this.closePanel}
        >
          <NewEntity onCreateEntity={this.createEntity} />
        </SidePanel>
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
  ${breakpoint(
    'small',
    `
      padding: 1rem 2rem;
    `
  )};
  padding: 0.3rem;
`
export default observe(
  observable => observable.pipe(map(state => ({ ...state }))),
  {}
)(hot(module)(App))
