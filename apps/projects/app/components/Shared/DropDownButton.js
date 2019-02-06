import React from 'react'
import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'
import { Spring, animated } from 'react-spring'
import ClickOutHandler from 'react-onclickout'
import { Button, springs, unselectable, theme } from '@aragon/ui'
import { IconArrowDown } from '../Shared'

const BASE_WIDTH = 118
const BASE_HEIGHT = 40

class DropDownButton extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    enabled: PropTypes.bool,
  }
  state = {
    opened: false,
  }
  handleClose = () => {
    this.setState({ opened: false })
  }
  handleBaseButtonClick = () => {
    this.setState(({ opened }, { enabled }) => enabled && { opened: !opened })
  }
  render() {
    const { opened } = this.state
    const { children, enabled } = this.props
    return (
      <ClickOutHandler onClickOut={this.handleClose}>
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
              <Button
                mode={enabled ? 'secondary' : 'strong'}
                onClick={this.handleBaseButtonClick}
                opened={opened}
                disabled={!enabled}
                wide
              >
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  Actions
                  <animated.div
                    style={{
                      margin: '0 -5px 0 5px',
                      color: enabled ? theme.textTertiary : theme.disabledText,
                      transform: openProgress.interpolate(
                        t => `rotate(${t * 180}deg)`
                      ),
                    }}
                  >
                    <IconArrowDown />
                  </animated.div>
                </div>
              </Button>
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
                {children}
              </Popup>
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
  top: ${BASE_HEIGHT - 2}px;
  right: 0;
  padding: 10px 0;
  background: ${theme.contentBackground};
  border: 1px solid ${theme.contentBorder};
  border-radius: 3px 0 3px 3px;
`

DropDownButton.BASE_WIDTH = 46
DropDownButton.BASE_HEIGHT = 32

export default DropDownButton
