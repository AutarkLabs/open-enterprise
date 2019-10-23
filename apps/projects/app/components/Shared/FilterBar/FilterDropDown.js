import React, { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Spring, animated } from 'react-spring'
import ClickOutHandler from 'react-onclickout'
import { springs, GU, theme } from '@aragon/ui'
import FilterButton from './FilterButton'
import { IconMore, IconDropArrow } from '../../../assets'

const FilterDropDown = ({ caption, children, enabled, type }) => {
  const [ opened, setOpened ] = useState(false)

  const handleClose = () => {}

  const handleClickOut = () => setOpened(false)

  const handleBaseButtonClick = () => {
    if (enabled) setOpened(!opened)
  }

  return (
    <ClickOutHandler onClickOut={handleClickOut}>
      <Spring
        config={springs.smooth}
        to={{ openProgress: Number(opened) }}
        native
      >
        {({ openProgress }) =>
          type === 'overflow' ? (
            <DropDownButtonOverflow
              disabled={!enabled}
              handleBaseButtonClick={handleBaseButtonClick}
              openProgress={openProgress}
              handleClose={handleClose}
            >
              {opened && children}
            </DropDownButtonOverflow>
          ) : (
            <DropDownButtonFilter
              disabled={!enabled}
              handleBaseButtonClick={handleBaseButtonClick}
              caption={caption}
              openProgress={openProgress}
              handleClose={handleClose}
              type={type}
            >
              {opened && children}
            </DropDownButtonFilter>
          )
        }
      </Spring>
    </ClickOutHandler>
  )
}
FilterDropDown.propTypes = {
  caption: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  enabled: PropTypes.bool.isRequired,
  type: PropTypes.string.isRequired,
}
FilterDropDown.defaultProps = {
  type: 'filter',
  caption: '',
  enabled: true,
}

const borders = {
  'overflowTop': '3px 3px 0 0',
  'overflowMiddle': '0',
  'overflowBottom': '0 0 3px 3px',
  'filter': '3px',
}

const DropDownButtonFilter = ({ disabled, handleBaseButtonClick, caption, openProgress, handleClose, type, children }) => (
  <Main>
    <FilterButton
      onClick={handleBaseButtonClick}
      disabled={disabled}
      width="128px"
      style={{ borderRadius: borders[type] }}
    >
      <div css={`display: flex; width: 100%; justify-content: space-between; padding: 0 ${2 * GU}px`}>
        {caption}
        <animated.div
          style={{
            height: '16px',
            transformOrigin: '50% 70%',
            transform: openProgress.interpolate(
              t => `rotate(${t * 180}deg)`
            ),
          }}
        >
          <IconDropArrow color={`${theme.surfaceContentSecondary}`} />
        </animated.div>
      </div>
    </FilterButton>

    <Popup onClick={handleClose} style={{ opacity: openProgress }}>
      {children}
    </Popup>
  </Main>
)
DropDownButtonFilter.propTypes = {
  disabled: PropTypes.bool.isRequired,
  handleBaseButtonClick: PropTypes.func.isRequired,
  caption: PropTypes.string.isRequired,
  openProgress: PropTypes.object.isRequired,
  handleClose: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}

const DropDownButtonOverflow = ({ disabled, handleBaseButtonClick, openProgress, handleClose, children }) => (
  <Main>
    <FilterButton
      onClick={handleBaseButtonClick}
      disabled={disabled}
      width="40px"
    >
      <IconMore />
    </FilterButton>

    <PopupOverflow onClick={handleClose} style={{ opacity: openProgress }}>
      {children}
    </PopupOverflow>
  </Main>
)
DropDownButtonOverflow.propTypes = {
  disabled: PropTypes.bool.isRequired,
  handleBaseButtonClick: PropTypes.func.isRequired,
  openProgress: PropTypes.object.isRequired,
  handleClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
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
  border-radius: 3px;
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.3);
  padding: ${GU}px 0;
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1;
`
const PopupOverflow = styled(animated.div)`
  border: 0;
  border-radius: 3px;
  padding: 0;
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1;
`

export default FilterDropDown
