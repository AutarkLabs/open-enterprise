import React from 'react'
import styled from 'styled-components'
import { theme } from '@aragon/ui'

import Overflow from './Overflow'
import FilterButton from './FilterButton'
import { CheckButton, IconArrowDown } from '../'

const StyledFilterBar = styled.div`
  width: 100%;
  background: ${theme.contentBackground};
  display: flex;
  margin: 12px 0;
  height: 40px;
  align-items: center;
  border-radius: 3px;
  > :first-child {
    width: 48px;
    padding: 0;
    justify-content: center;
    border-radius: 3px 0 0 3px;
  }
  > :nth-last-child(2) {
    flex: 1 1 auto;
  }
  > :last-child {
    border-radius: 0 3px 3px 0;
  }
`

// TODO: cards style like dropdowns
class FilterBar extends React.Component {
  render() {
    return (
      <StyledFilterBar>
        <FilterButton>
          <CheckButton />
        </FilterButton>
        <Overflow>
          <FilterButton>
            Projects <IconArrowDown />
          </FilterButton>
          <FilterButton>
            Status <IconArrowDown />
          </FilterButton>
          <FilterButton>
            Deadline <IconArrowDown />
          </FilterButton>
          <FilterButton>
            Experience <IconArrowDown />
          </FilterButton>
          <FilterButton>
            Milestones <IconArrowDown />
          </FilterButton>
          <FilterButton>
            Labels <IconArrowDown />
          </FilterButton>
        </Overflow>
        <FilterButton>
          <IconArrowDown /> Sort by status
        </FilterButton>
      </StyledFilterBar>
    )
  }
}
export default FilterBar
