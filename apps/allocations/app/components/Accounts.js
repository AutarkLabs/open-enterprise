import React from 'react'
import styled from 'styled-components'

import { EmptyStateCard, SidePanel } from '@aragon/ui'
import emptyIcon from '../assets/empty-accounts.svg'
import { AccountCard/*, NewAllocation*/ } from '.'

const EmptyIcon = () => <img src={emptyIcon} alt="" />

class Accounts extends React.Component {
  static defaultProps = {
    accounts: [],
    onSetDistribution: () => {},
    onClose: () => {},
  }

  state = {
    selectedAccountDescription: '',
    sidePanelOpened: false,
  }

  openSidePanel = description => {
    this.setState({
      selectedAccountDescription: description,
      sidePanelOpened: true,
    })
  }

  closeSidePanel = () => {
    this.setState({ sidePanelOpened: false })
  }

  render() {
    const accountsEmpty = this.props.accounts.length === 0
    return accountsEmpty ? (
      <EmptyCard onActivate={this.props.onActivate} />
    ) : (
      <StyledAccounts>
        {this.props.accounts.map(account => (
          <AccountCard
            // TODO: Make this more unique by id?
            key={account.description}
            {...account}
            openSidePanel={this.openSidePanel}
          />
        ))}
        <SidePanel
          title="New Allocation"
          opened={this.state.sidePanelOpened}
          onClose={this.closeSidePanel}
        >
          {/* <NewAllocation
            accountDescription={this.state.selectedAccountDescription}
            onSetDistribution={this.props.onSetDistribution}
            onClose={this.props.onClose}
          /> */}
        </SidePanel>
      </StyledAccounts>
    )
  }
}

const EmptyCard = ({ onActivate }) => (
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

const StyledEmptyWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
`

const StyledAccounts = styled.div`
  display: grid;
  grid-template-columns: repeat(3, auto);
  grid-auto-rows: auto;
  grid-gap: 2rem;
  justify-content: start;
`

export default Accounts
