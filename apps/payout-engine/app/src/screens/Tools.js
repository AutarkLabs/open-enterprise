import React from 'react'
import styled from 'styled-components'
import { ToolStore } from '../stores/ToolStore'
import { Subscribe } from 'laco-react'

import { EmptyStateCard, SidePanel } from '@aragon/ui'
import emptyIcon from '../assets/empty-allocation.svg'
import ToolCard from '../components/ToolCard'
import { NewPayoutVotePanelContent } from '../components/Panels'

const EmptyIcon = () => <img src={emptyIcon} alt="" />

class Tools extends React.Component {
  static defaultProps = {}

  state = {
    sidePanelOpened: false,
    tools: [{
      label: 'Monthly Reward DAO',
      address: '0x45f3...5567',
      stats: [
          {label: 'BALANCE', value: '10 ETH' },
          {label: 'BUDGET', value: '5 ETH / Month'}
      ]
    }]
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

    if (!tools.length) {
      return (
        <StyledEmptyWrapper>
          <EmptyStateCard
            icon={EmptyIcon}
            title="You have not created any allocation accounts."
            text="Get started now by creating a new account."
            actionText="New Account"
            onActivate={onActivate}
          />
        </StyledEmptyWrapper>
      )
    }

    return (
      <StyledTools>
        {tools.map((tool) => <ToolCard {...tool} openSidePanelLink={this.openSidePanel} />)}
        <SidePanel
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
