import React from 'react'
import styled from 'styled-components'
import { EmptyStateCard, SidePanel } from '@aragon/ui'
import emptyIcon from '../assets/empty-card-icon.svg'
import ToolCard from '../components/ToolCard'
import { NewPayoutVotePanelContent } from '../components/Panels'

const EmptyIcon = () => <img src={emptyIcon} alt="" />

const initialState = {
  sidePanelOpened: false,
  tools: [
    // {
    //     label: 'Monthly Reward DAO',
    //     description: 'Allocate our monthly reward DAO accross four circles: Governance, Dapp, Social Coding, and Comms',
    //     address: '0x45f3...5567',
    //     stats: [
    //         {label: 'BALANCE', value: '10 ETH' },
    //         {label: 'BUDGET', value: '5 ETH / Month'}
    //     ]
    // }
  ],
}

class Tools extends React.Component {
  static defaultProps = {}

  state = {
    ...initialState,
  }

  openSidePanel = () => {
    this.setState({ sidePanelOpened: true })
  }

  closeSidePanel = () => {
    this.setState({ sidePanelOpened: false })
  }

  render() {
    const { onActivate } = this.props
    const { sidePanelOpened, tools } = this.state
    
    if (tools.length === 0) {
      return (
        <StyledEmptyWrapper>
          <EmptyStateCard
            icon={EmptyIcon}
            title="You have not created any planning tools"
            text="Get started now by creating a new tool"
            actionText="New Tool"
            onActivate={onActivate}
          />
        </StyledEmptyWrapper>
      )
    }

    return (
      <StyledTools>
        <ToolCard openSidePanelLink={this.openSidePanel} />
        <SidePanel
          title=""
          opened={sidePanelOpened}
          onClose={this.closeSidePanel}
        >
          <NewPayoutVotePanelContent />
        </SidePanel>
      </StyledTools>
    )
  }
}

const StyledEmptyWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
`

const StyledTools = styled.div`
  display: grid;
  grid-template-columns: repeat(3, auto);
  grid-auto-rows: auto;
  grid-gap: 2rem;
  justify-content: start;
`

export default Tools
