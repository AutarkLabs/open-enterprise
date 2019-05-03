import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Spring, animated } from 'react-spring'
import ClickOutHandler from 'react-onclickout'
import { springs, theme } from '@aragon/ui'
import { IconSort } from '../../../../../../shared/ui'
import FilterButton from './FilterButton'

const BASE_HEIGHT = 40

class SortDropDown extends React.Component {
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
    this.setState(({ opened }) => { return { opened: !opened }})
  }

  render() {
    const { opened } = this.state
    const { caption, children } = this.props
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
                zIndex: '4',
                boxShadow: openProgress.interpolate(
                  t => `0 4px 4px rgba(0, 0, 0, ${t * 0.03})`
                ),
              }}
            >
              <FilterButton
                style={{ width: 'auto' }}
                mode="secondary"
                onClick={this.handleBaseButtonClick}
                opened={opened}
                disabled={false}
                wide
              >
                <IconSort />
                <span style={{ marginLeft: '15px' }}>{caption}</span>
              </FilterButton>

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
            </Main>
          )}
        </Spring>
      </ClickOutHandler>
    )
  }
}

const Main = styled(animated.div)`
  position: relative;
  width: auto;
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

export default SortDropDown
