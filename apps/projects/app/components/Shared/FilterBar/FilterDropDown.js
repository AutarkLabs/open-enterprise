import React, { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Spring, animated } from 'react-spring'
import ClickOutHandler from 'react-onclickout'
import { springs, theme } from '@aragon/ui'
import FilterButton from './FilterButton'
import { IconArrow as IconArrowDown } from '../../../../../../shared/ui'
import { IconMore } from '../../../assets'

const FilterDropDown = ({ caption, children, enabled, type }) => {
  const [ opened, setOpened ] = useState(false)

  const handleClose = () => {}

  const handleClickOut = () => setOpened(false)

  const handleBaseButtonClick = () => {
    if (enabled) setOpened(!opened)
  }

  const buttonFilter = (caption, openProgress) => (
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

  const buttonOverflow = () => <IconMore />

  return (
    <ClickOutHandler onClickOut={handleClickOut}>
      <Spring
        config={springs.smooth}
        to={{ openProgress: Number(opened) }}
        native
      >
        {({ openProgress }) => (
          <Main>
            <FilterButton
              onClick={handleBaseButtonClick}
              disabled={!enabled}
              width={type === 'overflow' ? '40px' : '128px'}
            >
              {type === 'filter' ? buttonFilter(caption, openProgress) : ''}
              {type === 'overflow' ? buttonOverflow() : ''}
            </FilterButton>
            <Popup
              onClick={handleClose}
              style={{ opacity: openProgress }}
            >
              {opened && children}
            </Popup>
          </Main>
        )}
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
