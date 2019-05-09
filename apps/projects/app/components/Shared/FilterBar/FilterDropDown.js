import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Spring, animated } from 'react-spring'
import ClickOutHandler from 'react-onclickout'
import { springs, theme } from '@aragon/ui'
import FilterButton from './FilterButton'
import { IconSort, IconDots } from '../../../../../../shared/ui'
import { IconArrow as IconArrowDown } from '../../../../../../shared/ui'

const BASE_WIDTH = 150
const BASE_HEIGHT = 40

class FilterDropDown extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    enabled: PropTypes.bool,
    width: PropTypes.string,
    type: PropTypes.string,
  }
  static defaultProps = {
    width: BASE_WIDTH + 'px',
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
      {caption}
      <animated.div
        style={{
          margin: '0px',
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
      <span style={{ marginLeft: '15px' }}>{caption}</span>
    </React.Fragment>
  )

  buttonOverflow = caption => (
    <React.Fragment>
      <IconDots />
      <span style={{ marginLeft: '15px' }}>{caption}</span>
    </React.Fragment>
  )

  popupStandard = (opened, openProgress, children) => (
    <Popup
      onClick={this.handleClose}
      style={{
        display: opened ? 'block' : 'none',
        opacity: openProgress,
        boxShadow: openProgress.interpolate(
          t => `0 4px 4px rgba(0, 0, 0, ${t * 0.03})`
        ),
      }}
    >
      {opened && children}
    </Popup>
  )

  popupOverflow = (opened, openProgress, children) => (
    <PopupOverflow
      onClick={this.handleClose}
      style={{
        display: opened ? 'block' : 'none',
        opacity: openProgress,
        boxShadow: openProgress.interpolate(
          t => `0 4px 4px rgba(0, 0, 0, ${t * 0.03})`
        ),
      }}
    >
      {opened && children}
    </PopupOverflow>
  )

  render() {
    const { opened } = this.state
    const { caption, children, enabled, width, type } = this.props
    let zIndex = opened ? '2' : '1'
    if (type === 'sorter') zIndex  = 4

    return (
      <ClickOutHandler onClickOut={this.handleClickOut}>
        <Spring
          config={springs.smooth}
          to={{ openProgress: Number(opened) }}
          native
        >
          {({ openProgress }) => (
            <Main
              width={width}
              style={{
                zIndex,
                boxShadow: openProgress.interpolate(
                  t => `0 4px 4px rgba(0, 0, 0, ${t * 0.03})`
                ),
              }}
            >
              <FilterButton
                style={{ width: this.props.width }}
                mode={enabled ? 'secondary' : 'strong'}
                onClick={this.handleBaseButtonClick}
                opened={opened}
                disabled={!enabled}
                wide
              >
                {type === 'filter' ? this.buttonFilter(caption, openProgress) : ''}
                {type === 'sorter' ? this.buttonSort(caption) : ''}
                {type === 'overflow' ? this.buttonOverflow(caption) : ''}
              </FilterButton>
              {type === 'overflow' ?
                this.popupOverflow(opened, openProgress, children)
                :
                this.popupStandard(opened, openProgress, children)
              }
            </Main>
          )}
        </Spring>
      </ClickOutHandler>
    )
  }
}

const Main = styled(animated.div)`
  position: relative;
  width: ${props => props.width};
  height: ${BASE_HEIGHT}px;
`
const Popup = styled(animated.div)`
  overflow: hidden;
  position: absolute;
  top: ${BASE_HEIGHT - 1}px;
  right: 0;
  padding: 10px 0;
  background: ${theme.contentBackground};
  border: 1px solid ${theme.contentBorder};
  border-radius: 3px 0 3px 3px;
`
const PopupOverflow = styled(animated.div)`
  position: absolute;
  top: ${BASE_HEIGHT - 1}px;
  left: 0;
  padding: 0;
  background: ${theme.contentBackground};
  border: 0px solid ${theme.contentBorder};
  > :not(:first-child) {
    margin-top: -1px;
  }
`

export default FilterDropDown
