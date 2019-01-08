import styled from 'styled-components'
import { theme } from '@aragon/ui'

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

export default CheckButton
