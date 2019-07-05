import styled from 'styled-components'
import { unselectable, theme } from '@aragon/ui'

const FilterButton = styled.button`
  align-items: center;
  background: ${theme.contentBackground};
  border: none;
  cursor: pointer;
  display: flex;
  height: 100%;
  margin: 0;
  padding: 8px 16px;
  transition: box-shadow 0.1s ease-out;
  white-space: nowrap;
  width: 100%;
  :hover, :focus, :active {
    outline: none;
    box-shadow: 0 0 8px 4px rgba(0, 0, 0, 0.06);
  }

  > *:not(:first-child) {
    margin-left: 6px;
  }
`

export default FilterButton
