import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Spring, animated } from 'react-spring'
import ClickOutHandler from 'react-onclickout'
import { springs, theme } from '@aragon/ui'
import FilterButton from './FilterButton'
import { IconDots } from '../../../../../../shared/ui'

const BASE_HEIGHT = 40

class DotsDropDown extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    enabled: PropTypes.bool,
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

  render() {
    const { opened } = this.state
    const { children, enabled } = this.props
    
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
                style={{ width: '212px' }}
                onClick={this.handleBaseButtonClick}
                opened={opened}
                disabled={!enabled}
                wide
              >
                <IconDots />
              </FilterButton>
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
            </Main>
          )}
        </Spring>
      </ClickOutHandler>
    )
  }
}

const Main = styled(animated.div)`
  position: relative;
  height: ${BASE_HEIGHT}px;
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

export default DotsDropDown
