import React, { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import {
  springs,
  Button,
  DropDown,
  GU,
  useTheme,
} from '@aragon/ui'
import { usePanelManagement } from '../../Panel'
import {
  OptionsProjects,
  OptionsLabels,
  OptionsMilestones,
  OptionsStatuses,
} from '../../Shared/FilterBar/FiltersOptions'
import { Spring, animated } from 'react-spring'
import ClickOutHandler from 'react-onclickout'
//import FilterButton from '../../Shared/FilterBar/FilterButton'
import { IconDropArrow } from '../../../assets'

const FilterButton = ({ children, onClick, disabled }) => {
  const theme = useTheme()

  return (
    <button
      css={`
        display: inline-flex;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
        -webkit-box-pack: center;
        justify-content: center;
        width: 100%;
        height: 40px;
        padding: 0;
        user-select: none;
        background: ${theme.surface};
        color: ${theme.surfaceContent};
        white-space: nowrap;
        border: 0;
        border-bottom: 1px solid ${theme.border};
        border-top: 1px solid ${theme.border};
        margin-top: -1px;
        transition-property: transform,box-shadow;
        transition-duration: 50ms;
        transition-timing-function: ease-in-out;
        :hover, :focus, :active {
          outline: none;
          box-shadow: 8px 0 8px 0 rgba(0, 0, 0, 0.06);
        }
      `}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
FilterButton.propTypes = {
  width: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
}
FilterButton.defaultProps = {
  disabled: false,
}


const SpringWrap = ({ handleClickOut, opened, children }) => (
  <ClickOutHandler onClickOut={handleClickOut}>
    <Spring
      config={springs.smooth}
      to={{ openProgress: Number(opened) }}
      native
    >
      {({ openProgress }) => children(openProgress)}
    </Spring>
  </ClickOutHandler>
)
SpringWrap.propTypes = {
  children: PropTypes.func.isRequired,
  opened: PropTypes.bool.isRequired,
  handleClickOut: PropTypes.func.isRequired,
}

const FilterDropDown = ({ caption, children, enabled }) => {
  const [ opened, setOpened ] = useState(false)
  const handleClickOut = () => setOpened(false)
  const handleBaseButtonClick = () => {
    if (enabled) setOpened(!opened)
    console.log('opened:', opened, enabled)
  }

  const theme = useTheme()

  const Main = styled(animated.div)`
  background: ${theme.white};
`
const Popup = styled(animated.div)`
  background: ${theme.background};
  padding: ${GU}px;
`

  return (
    <SpringWrap opened={opened}>
      {(openProgress) => (
        <Main>
          <FilterButton
            onClick={handleBaseButtonClick}
            disabled={!enabled}
            width="100%"
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

          {opened &&
            <Popup style={{ opacity: openProgress }}>
              {children}
            </Popup>
          }
        </Main>
      )}
    </SpringWrap>
  )
}
FilterDropDown.propTypes = {
  caption: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  enabled: PropTypes.bool.isRequired,
}
FilterDropDown.defaultProps = {
  enabled: true,
}

const Filters = ({ applyFilter, filters, filtersData }) => {
console.log('++++', applyFilter, filters, filtersData)
  const { closePanel } = usePanelManagement()

  return (
    <div css={`margin: 0 -${3*GU}px 0 -${3*GU}px`}>
    <FilterDropDown
      caption="Projects"
      enabled={Object.keys(filtersData.projects).length > 0}
      onChange={applyFilter}
    >
      <OptionsProjects projects={filtersData.projects} />
    </FilterDropDown>

    <FilterDropDown caption="Labels" enabled={Object.keys(filtersData.labels).length > 0}>
      <OptionsLabels labels={filtersData.labels} />
    </FilterDropDown>

    <FilterDropDown caption="Milestones" enabled={Object.keys(filtersData.milestones).length > 0}>
      <OptionsMilestones milestones={filtersData.milestones} />
    </FilterDropDown>

    <FilterDropDown caption="Status" enabled={Object.keys(filtersData.statuses).length > 0}>
      <OptionsStatuses statuses={filtersData.statuses} />
    </FilterDropDown>

    <Button onClick={() => applyFilter('hello from panel')} label="done">done</Button>
    </div>
  )
}
Filters.propTypes = {
  filtersData: PropTypes.object.isRequired,
}



export default Filters

