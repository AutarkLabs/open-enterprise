import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Spring, animated } from 'react-spring'
import ClickOutHandler from 'react-onclickout'
import { springs, theme } from '@aragon/ui'
import FilterButton from './FilterButton'
import { IconFilter, IconSort } from '../../../../../../shared/ui'
import { IconArrow as IconArrowDown } from '../../../../../../shared/ui'

class FilterDropDown extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    enabled: PropTypes.bool,
    type: PropTypes.string,
  }
  static defaultProps = {
    type: 'filter',
  }

  state = {
    opened: false,
  }

  handleClose = () => {}

  handleClickOut = () => {
    this.setState({ opened: false })
  }

  handleBaseButtonClick = () => {
    this.setState(({ opened }, { enabled }) => enabled && { opened: !opened })
  }

  buttonFilter = (caption, openProgress) => (
    <React.Fragment>
      <span>{caption}</span>
      <animated.div
        style={{
          height: '12px',
          transform: openProgress.interpolate(
            t => `rotate(${t * 180}deg)`
          ),
        }}
      >
        <IconArrowDown />
      </animated.div>
    </React.Fragment>
  )

  buttonSort = caption => (
    <React.Fragment>
      <IconSort />
      <span>{caption}</span>
    </React.Fragment>
  )

  buttonOverflow = caption => (
    <React.Fragment>
      <IconFilter />
      <span>{caption}</span>
    </React.Fragment>
  )

  render() {
    const { opened } = this.state
    const { caption, children, enabled, type, style } = this.props

    return (
      <ClickOutHandler onClickOut={this.handleClickOut}>
        <Spring
          config={springs.smooth}
          to={{ openProgress: Number(opened) }}
          native
        >
          {({ openProgress }) => (
            <Main>
              <FilterButton
                onClick={this.handleBaseButtonClick}
                disabled={!enabled}
              >
                {type === 'filter' ? this.buttonFilter(caption, openProgress) : ''}
                {type === 'sorter' ? this.buttonSort(caption) : ''}
                {type === 'overflow' ? this.buttonOverflow(caption) : ''}
              </FilterButton>
              <Popup
                onClick={this.handleClose}
                style={{ ...style, opacity: openProgress }}
              >
                {opened && children}
              </Popup>
            </Main>
          )}
        </Spring>
      </ClickOutHandler>
    )
  }
}

const Main = styled(animated.div)`
  background: ${theme.contentBackground};
  height: 100%;
  position: relative;
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0);
`
const Popup = styled(animated.div)`
  background: ${theme.contentBackground};
  border: 1px solid ${theme.contentBorder};
  border-radius: 3px 0 3px 3px;
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.3);
  padding: 10px 0;
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1;
`
export default FilterDropDown
