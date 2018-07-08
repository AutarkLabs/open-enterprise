import React from 'react'
import styled from 'styled-components'


class CheckboxInput extends React.Component {
// disabled checkboxes might not need handlers
//  static propTypes = {
//    onClick: PropTypes.func.isRequired,
//  }

  static defaultProps = {
    isDisabled: false,
    label: ''
  }

  // initial state of checkedness is taken from props, but then it's kept internally
  // so parent doesn't have to
  state = {
    isChecked: this.props.isChecked,
  }

  onClickInternal = () => {
    var isChecked = ! this.state.isChecked
    this.setState({isChecked: isChecked});
    this.props.onClick(isChecked)
  }

  onChange = () => {
    // checkbox itself is disabled, so it is not going to be called
    // but without it an error is reported about missing 'onChange'
    // handler
  }

  static getDerivedStateFromProps(props, state) {
    if (! ('isChecked' in props)) return null
    if (props.isChecked === state.isChecked) return null
    return { isChecked: props.isChecked }
  }

  render() {
    const { isChecked } = this.state 

    return (
      <span onClick={this.props.isDisabled ? null : this.onClickInternal}>
        <Checkbox checked={isChecked} disabled={this.props.isDisabled} onChange={this.onChange} label={this.props.label} />
        <span>{
          isChecked ? '✔' : ''
        }</span>
        { this.props.label }
      </span>
    )
  }
}

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  display: none;
  + span {
    display: inline-block;
    position: relative;
    top: -1px;
    width: 16px;
    height: 16px;
    margin: -1px 0px 0 0;
    vertical-align: middle;
    background: #f8fcfd left top no-repeat;
    border-radius: 3px;
    border: 1px solid #d0e2e7;
    cursor: pointer;
    line-height: 16px;
    text-align: center;
  }
  :checked + span {
    background: #F8FCFF -19px top no-repeat;
  }
  :disabled + span {
    background: #EEE -19px top no-repeat;
    border: 1px solid #DDD;
    cursor: default;
  }
  + span {
    margin-right: ${props => props.label ? '14px' : '0px'};
  }
`
export default CheckboxInput
