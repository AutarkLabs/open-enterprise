import React from 'react'
import styled from 'styled-components'
import { theme } from '@aragon/ui'

import { IconArrowDown } from '../../assets'
import Overflow from './Overflow'
import FilterButton from './FilterButton'

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

const CheckButton = styled.input.attrs({ type: 'checkbox' })`
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 14px;
  height: 14px;
  margin: 5px;
  background: ${theme.shadow};
  border: 1px solid ${theme.contentBorder};
  border-radius: 3px;
  outline: 0;
  cursor: pointer;
  ::after {
    content: url('data:image/svg+xml;utf8,<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="14" height="10"><path d="M4.176 7.956L12.114 0l1.062 1.062-9 9L0 5.886l1.044-1.062z" fill-rule="evenodd"/></svg>');
    position: absolute;
    left: -0.6px;
    top: -5px;
    opacity: 0;
    transform: scale(0.3) rotate(-45deg);
    transition: all 100ms ease-in-out;
  }
  :active {
    border-color: ${theme.contentBorderActive};
  }
  :checked::after {
    opacity: 1;
    transform: scale(0.8);
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
