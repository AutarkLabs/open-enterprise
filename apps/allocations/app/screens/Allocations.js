import React from 'react'
import styled from 'styled-components'
import { AllocationStore } from '../stores/AllocationStore'
import { Subscribe } from 'laco-react'

import { EmptyStateCard, SidePanel } from '@aragon/ui'
import emptyIcon from '../assets/empty-allocation.svg'
import AllocationCard from '../components/AllocationCard'
import { NewPayoutVotePanelContent } from '../components/Panels'

const EmptyIcon = () => <img src={emptyIcon} alt="" />

class Allocations extends React.Component {
  static defaultProps = {
    onSetDistribution: () => {},
    onClose: () => {}
  }

  state = {
    sidePanelOpened: false,
    allocations: [{
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
    const { onActivate, accounts } = this.props
    const { sidePanelOpened, allocations } = this.state

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
      <StyledAllocations>
        {accounts.map((account) => <AllocationCard {...account} openSidePanelLink={this.openSidePanel} />)}
        <SidePanel
          opened={sidePanelOpened}
          onClose={this.closeSidePanel}
        >
          <NewPayoutVotePanelContent
            onSetDistribution = {this.props.onSetDistribution}
            onClose = {this.props.onClose}
          />
        </SidePanel>
      </StyledAllocations>
    )
  }
}

const StyledEmptyWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
`

const StyledAllocations = styled.div`
  display: grid;
  grid-template-columns: repeat(3, auto);
  grid-auto-rows: auto;
  grid-gap: 2rem;
  justify-content: start;
`

export default Allocations
