import styled from 'styled-components'
import { theme } from '@aragon/ui'

const FilterButton = styled.button`
  display: inline-flex;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  -webkit-box-pack: center;
  justify-content: center;
  width: ${props => props.width};
  height: 40px;
  min-width: 0;
  padding: 0;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  user-select: none;
  background: #FFFFFF;
  color: #212B36;
  white-space: nowrap;
  border: 1px solid #DDE4E9;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition-property: transform,box-shadow;
  transition-duration: 50ms;
  transition-timing-function: ease-in-out;
  border-radius: 3px;
  :hover, :focus, :active {
    outline: none;
    box-shadow: 0 0 8px 4px rgba(0, 0, 0, 0.06);
  }
`

export default FilterButton
