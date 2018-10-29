import styled from 'styled-components'

const CheckBox = styled.input.attrs({ type: 'checkbox' })`
  color: green;
  appearance: none;
  display: inline-flex;
  position: relative;
  margin: 0;
  /* top: 0.4rem; */
  width: 14px;
  height: 14px;
  /* margin: 5px; */
  background: #f3f9fb;
  border: 1px solid #daeaef;
  border-radius: 3px;
  outline: 0;
  cursor: pointer;
  ::after {
    content: url('data:image/svg+xml;utf8,<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="14" height="10"><path d="M4.176 7.956L12.114 0l1.062 1.062-9 9L0 5.886l1.044-1.062z" fill-rule="evenodd"/></svg>');
    color: #daeaef;
    position: absolute;
    left: -0.0375rem;
    top: -0.0625rem;
    opacity: 0;
    transform: scale(0.3) rotate(-45deg);
    transition: all 100ms ease-in-out;
  }
  :active {
    border-color: #c9d9de;
  }
  :checked::after {
    opacity: 1;
    transform: scale(0.8);
    color: #1dd9d5;
  }
`

export default CheckBox
