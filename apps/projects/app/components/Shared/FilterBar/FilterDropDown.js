import React from 'react'
import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'
import { Spring, animated } from 'react-spring'
import ClickOutHandler from 'react-onclickout'
import { Button, springs, unselectable, theme } from '@aragon/ui'
import { IconArrowDown } from '../../Shared'
import FilterButton from './FilterButton'

const BASE_WIDTH = 150
const BASE_HEIGHT = 40

class FilterDropDown extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    enabled: PropTypes.bool,
    overflow: PropTypes.bool,
  }
  static defaultProps = {
    overflow: false,
  }
  state = {
    opened: false,
  }
  handleClose = () => {
    //console.log('handle CLOSE')
  }

  handleClickOut = () => {
    this.setState({ opened: false })
    //console.log('handle CLOSE handleClickOut')
  }

  handleBaseButtonClick = () => {
    this.setState(({ opened }, { enabled }) => enabled && { opened: !opened })
    //console.log('handleBaseButtonClick')
  }

  render() {
    const { opened } = this.state
    const { caption, children, enabled, overflow } = this.props
    return (
      <ClickOutHandler onClickOut={this.handleClickOut}>
        <Spring
          config={springs.smooth}
          to={{ openProgress: Number(opened) }}
          native
        >
          {({ openProgress }) => (
            <Main
              style={{
                zIndex: opened ? '2' : '1',
                boxShadow: openProgress.interpolate(
                  t => `0 4px 4px rgba(0, 0, 0, ${t * 0.03})`
                ),
              }}
            >
              <FilterButton
                mode={enabled ? 'secondary' : 'strong'}
                onClick={this.handleBaseButtonClick}
                opened={opened}
                disabled={!enabled}
                wide
              >
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
              </FilterButton>

              {overflow ? (
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
              ) : (
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
              )}
            </Main>
          )}
        </Spring>
      </ClickOutHandler>
    )
  }
}

const Main = styled(animated.div)`
  position: relative;
  width: ${BASE_WIDTH}px;
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
  right: 0;
  padding: 0;
  background: ${theme.contentBackground};
  border: 0px solid ${theme.contentBorder};
  > :not(:first-child) {
    margin-top: -1px;
  }
`

FilterDropDown.BASE_WIDTH = 46
FilterDropDown.BASE_HEIGHT = 32

export default FilterDropDown
