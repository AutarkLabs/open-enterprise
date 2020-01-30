import React, { useState } from 'react'
import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'
import { Button, Text, useTheme } from '@aragon/ui'
import {
  addMonths,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format as formatDate,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subYears
} from 'date-fns'

//const mainColor = '#30D9D4'

const Container = styled.div`
  display: grid;
  min-width: 15em;
  margin: 0 auto;
  padding-top: 0.5em;
  background: ${props => props.theme.surface};
  border: 1px solid ${props => props.theme.border};
  border-radius: 3px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);

  ${props => props.overlay && css`
    &&& {
      position: absolute;
      ${props => props.verticalAlign === 'top' && css`
        top:40px;
      `}
      ${props => props.verticalAlign === 'bottom' && css`
        bottom: 40px;
      `}
      ${props => props.horizontalAlign === 'left' && css`
        left:0;
      `}
      ${props => props.horizontalAlign === 'right' && css`
        right: 0;
      `}
      z-index: 10;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
    }
  `}
`

const Selector = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const ArrowButton = styled(Button.Anchor)`
  font-size: 60%;
  color: ${props => props.theme.border};

  &:hover {
    border: none;
    box-shadow: none;
    color: inherit;
  }
`

const MonthView = styled.ol`
  margin: 0;
  padding: 0.5em;
  display: grid;
  grid-gap: 0.25em;
  grid-template: auto / repeat(7, 1fr);
  list-style: none;
`

const DayView = styled.li`
  position: relative;
  width: 2.571em;
  height: 2.571em;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  font-size: 90%;
  user-select: none;
  ${props => props.today && css`
    border: 1px solid ${props => props.theme.disabledContent};
  `}

  ${props => props.disabled && css`
    pointer-events: none;
    color: ${props => props.theme.disabledContent};
  `}
  ${props => props.selected && css`
    &&& {
      background: ${props => props.theme.accent};
      border-color: ${props => props.theme.accent};
      color: ${props => props.theme.accentContent};
    }
  `}
  &::after {
    display: block;
    content: '';
    margin-top: 100%;
  }

  &:hover {
    background: ${props => props.theme.surfaceHighlight};
  }
`

const WeekDay = styled(DayView)`
  pointer-events: none;
  color: ${props => props.theme.surfaceContentSecondary};
  text-transform: uppercase;
`

const DatePicker = ({
  horizontalAlign,
  verticalAlign,
  currentDate,
  overlay,
  dayFormat,
  weekDayFormat,
  monthFormat,
  yearFormat,
  monthYearFormat,
  hideWeekDays,
  hideMonthSelector,
  hideYearSelector,
  onSelect
}) => {
  const theme = useTheme()
  const [ value, setValue ] = useState(currentDate || new Date())
  const today = startOfDay(new Date())
  //const { value: selected = today } = this.state

  const handleSelection = (date) => (event) => {
    event.preventDefault()

    if (typeof onSelect === 'function') {
      onSelect(date)
    }
  }

  const nextMonth = (event) => {
    event.stopPropagation()
    setValue(addMonths(startOfMonth(value), 1))
  }

  const nextYear = (event) => {
    event.stopPropagation()
    setValue(addYears(startOfMonth(value), 1))
  }

  const previousMonth = (event) => {
    event.stopPropagation()
    setValue(subMonths(startOfMonth(value), 1))
  }

  const previousYear = (event) => {
    event.stopPropagation()
    setValue(subYears(startOfMonth(value), 1))
  }

  return (
    <Container overlay={overlay} theme={theme} horizontalAlign={horizontalAlign} verticalAlign={verticalAlign}>
      {!hideYearSelector && (
        <Selector>
          <ArrowButton onClick={previousYear} theme={theme}>
            ◀
          </ArrowButton>
          <Text size='normal'>
            {formatDate(value, yearFormat)}
          </Text>
          <ArrowButton onClick={nextYear} theme={theme}>
            ▶
          </ArrowButton>
        </Selector>
      )}

      {!hideMonthSelector && (
        <Selector>
          <ArrowButton onClick={previousMonth} theme={theme}>
            ◀
          </ArrowButton>
          <Text size='large' weight='bold'>
            {formatDate(value, !hideYearSelector
              ? monthFormat
              : monthYearFormat
            )}
          </Text>
          <ArrowButton onClick={nextMonth} theme={theme}>
            ▶
          </ArrowButton>
        </Selector>
      )}

      <MonthView>
        {!hideWeekDays && eachDayOfInterval({
          start: startOfWeek(value),
          end: endOfWeek(value)
        }).map(day => (
          <WeekDay key={formatDate(day, 'eeeeee')} theme={theme}>
            <Text size='xsmall'>
              {formatDate(day, weekDayFormat)}
            </Text>
          </WeekDay>
        ))}

        {eachDayOfInterval({
          start: startOfWeek(startOfMonth(value)),
          end: endOfWeek(endOfMonth(value))
        }).map(day => (
          <DayView
            key={day.getTime()}
            disabled={value.getMonth() !== day.getMonth()}
            selected={isSameDay(day, currentDate)}
            today={isSameDay(day, today)}
            onClick={handleSelection(day)}
            theme={theme}
          >
            <Text size='small'>
              {formatDate(day, dayFormat)}
            </Text>
          </DayView>
        ))}
      </MonthView>
    </Container>
  )
}

DatePicker.propTypes = {
  currentDate: PropTypes.instanceOf(Date),

  // Events
  onSelect: PropTypes.func,

  // Visibility
  hideMonthSelector: PropTypes.bool,
  hideWeekDays: PropTypes.bool,
  hideYearSelector: PropTypes.bool,
  overlay: PropTypes.bool,

  // Formatting
  dayFormat: PropTypes.string,
  monthFormat: PropTypes.string,
  monthYearFormat: PropTypes.string,
  weekDayFormat: PropTypes.string,
  yearFormat: PropTypes.string
}

DatePicker.defaultProps = {
  onSelect: () => {},
  dayFormat: 'd',
  monthFormat: 'MMMM',
  monthYearFormat: 'MMMM yyyy',
  weekDayFormat: 'eee',
  yearFormat: 'yyyy',
  horizontalAlign: 'right',
  verticalAlign: 'top',
}

export default DatePicker
