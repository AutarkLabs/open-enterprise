import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { useAragonApi } from '@aragon/api-react'
import {
  TextInput,
  theme,
  ContextMenuItem,
  IconFundraising,
  breakpoint,
} from '@aragon/ui'
import { DropDownButton, IconCurate } from '../Shared'
import ActiveFilters from './Filters'

const ActionsMenu = ({
  disableFilter,
  disableAllFilters,
  filters,
  issues,
  onAllocateBounties,
  onCurateIssues,
  onSearchChange,
  selectedIssues,
}) => {

  const { issues: bountyIssues } = useAragonApi().appState

  return (
    <Wrap>
      <TextInput
        style={{ gridArea: 'search' }}
        placeholder="Search issue titles"
        type="search"
        onChange={onSearchChange}
      />
      <ActiveFilters
        style={{ gridArea: 'filter' }}
        issues={issues}
        bountyIssues={bountyIssues}
        filters={filters}
        disableFilter={disableFilter}
        disableAllFilters={disableAllFilters}
      />
      <DropDownButton
        enabled={Object.keys(selectedIssues).length !== 0}
        style={{ gridArea: 'action' }}
      >
        <ContextMenuItem
          onClick={onCurateIssues}
          style={{ display: 'flex', alignItems: 'flex-start' }}
        >
          <div>
            <IconCurate color={theme.textTertiary} />
          </div>
          <ActionLabel>Curate Issues</ActionLabel>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={onAllocateBounties}
          style={{ display: 'flex', alignItems: 'flex-start' }}
        >
          <div style={{ marginLeft: '4px' }}>
            <IconFundraising color={theme.textTertiary} />
          </div>
          <ActionLabel>Fund Issues</ActionLabel>
        </ContextMenuItem>
      </DropDownButton>
    </Wrap>
  )
}

ActionsMenu.propTypes = {
  disableFilter: PropTypes.func.isRequired,
  disableAllFilters: PropTypes.func.isRequired,
  filters: PropTypes.object.isRequired,
  issues: PropTypes.object.isRequired,
  onAllocateBounties: PropTypes.func.isRequired,
  onCurateIssues: PropTypes.func.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  selectedIssues: PropTypes.object.isRequired,
}

const Wrap = styled.div`
  display: grid;
  align-items: center;
  padding: 0;
  grid-gap: 10px;
  grid-template-areas:
    'search action'
    'filter filter';
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  ${breakpoint(
    'small',
    `
      grid-template-areas: 'search filter action';
      grid-template-columns: 1fr 1fr auto;
    `
  )}
`

const ActionLabel = styled.span`
  margin-left: 15px;
`

export default ActionsMenu
