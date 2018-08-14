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
      title: 'Monthly Reward DAO',
      address: '0x5ADF43DD006c6C36506e2b2DFA352E60002d22Dc',
      balance: 0,
      limit: { label: 'ETH', value: 0 }
    }]
  }

  openSidePanel = () => {
    this.setState({ sidePanelOpened: true })
  }

  closeSidePanel = () => {
    this.setState({ sidePanelOpened: false })
  }

  render() {
    const { onActivate, accounts } = this.props
    const { sidePanelOpened, tools } = this.state

    if (!accounts.length) {
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
        {accounts.map((account) => <ToolCard {...account} openSidePanelLink={this.openSidePanel} />)}
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
