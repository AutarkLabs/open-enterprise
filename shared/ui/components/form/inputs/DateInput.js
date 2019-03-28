import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { isDate, format as formatDate } from 'date-fns'

import { TextInput } from '@aragon/ui'
import DatePicker from './DatePicker'
import { IconCalendar } from '../../assets'

const Container = styled.div`
  width: ${props => props.width};
  display: flex;
`
const IconWrapper = styled.div`
  position: relative;
  left: -28px;
  top: 12px;
  height: 14px;
`
const TextInputDate = styled(TextInput).attrs({
  readOnly: true
})`
  width: ${props => props.width};
  display: inline-block;
  padding-top: 3px;
`

class DateInput extends React.PureComponent {
  constructor(props) {
    super(props)

    this.setWrapperRef = this.setWrapperRef.bind(this)
    this.handleClickOutside = this.handleClickOutside.bind(this)
  }

  state = {
    showPicker: false,
    value: this.props.value
  }

  componentWillUnmount () {
    document.removeEventListener('mousedown', this.handleClickOutside)
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside)
  }

  setWrapperRef(node) {
    this.wrapperRef = node
  }

  handleClick = (event) => {
    event.stopPropagation()
    this.setState({ showPicker: true })
  }

  handleClickOutside = (event) => {
    if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
      this.setState({ showPicker: false })
    }
  }

  handleSelect = date => {
    this.props.onChange(date)
    this.setState({ showPicker: false })
  }

  render () {
    const { value, width } = this.props
    const formattedValue = formatDate(value, this.props.format)

    return (
      <Container
        ref={this.setWrapperRef}
        width={width}
      >
        <TextInputDate
          value={formattedValue}
          onClick={this.handleClick}
          width={width}
        />

        <IconWrapper onClick={this.handleClick}>
          <IconCalendar />
        </IconWrapper>

        {this.state.showPicker && (
          <DatePicker
            currentDate={value}
            onSelect={this.handleSelect}
            overlay={true}
          />
        )}
      </Container>
    )
  }
}

DateInput.propTypes = {
  format: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.any,
  width: PropTypes.string,
}

DateInput.defaultProps = {
  value: new Date(),
  format: 'LL/dd/yyyy',
  onChange: () => {},
  width: '180px',
}

export default DateInput
