import styled from 'styled-components'
import { unselectable } from '@aragon/ui'

const FilterButton = styled.div`
  display: inline-flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-between;
  border: 1px solid rgba(209, 209, 209, 0.5);
  padding: 15px 20px;
  height: 40px;
  margin-left: -1px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  width: 150px;
  transition: all 0.3s ease-out;
  ${unselectable};
  :hover {
    box-shadow: 0 0 8px 4px rgba(0, 0, 0, 0.06);
  }
`

export default FilterButton
