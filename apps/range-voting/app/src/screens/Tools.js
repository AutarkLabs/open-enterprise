import React from 'react'
import styled from 'styled-components'
import { ToolStore } from '../stores/ToolStore'
import { Subscribe } from 'laco-react'

import { EmptyStateCard, SidePanel } from '@aragon/ui'
import emptyIcon from '../assets/empty-card-icon.svg'
import ToolCard from '../components/ToolCard'
import { NewPayoutVotePanelContent } from '../components/Panels'

const EmptyIcon = () => <img src={emptyIcon} alt="" />

const initialState = {
  sidePanelOpened: false,
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
    const { sidePanelOpened } = this.state

    if (ToolStore.get().tools.length === 0) {
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
        <Subscribe to={[ToolStore]}>
          {({ tools }) => (
            tools.map((tool) => 
              (<ToolCard {...tool} openSidePanelLink={this.openSidePanel} />)
            )
          )}
        </Subscribe>
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
