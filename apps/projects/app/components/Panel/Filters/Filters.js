import React, { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import {
  springs,
  GU,
  IconCheck,
  useTheme,
} from '@aragon/ui'
import {
  OptionsProjects,
  OptionsLabels,
  OptionsMilestones,
  OptionsStatuses,
} from '../../Shared/FilterBar/FilterOptions'
import { Spring, animated } from 'react-spring'
import ClickOutHandler from 'react-onclickout'
import { IconDropArrow } from '../../../assets'
import { sortOptions, useIssueFilters } from '../../../context/IssueFilters'
import ActiveFilters from '../../Shared/FilterBar/ActiveFilters'
import Label from '../../Content/IssueDetail/Label'

const noop = () => {}

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
  const handleBaseButtonClick = () => {
    if (enabled) setOpened(!opened)
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
    <SpringWrap opened={opened} handleClickOut={noop}>
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

const Filters = () => {
  const { availableFilters, activeFiltersCount, sortBy, setSortBy } = useIssueFilters()
  const theme = useTheme()

  return (
    <div css={`
    margin: 0 -${3*GU}px;
    padding: ${2 * GU};
    `}>
      <FilterDropDown caption="Projects" enabled={Object.keys(availableFilters.projects).length > 0}>
        <OptionsProjects />
      </FilterDropDown>

      <FilterDropDown caption="Labels" enabled={Object.keys(availableFilters.labels).length > 0}>
        <OptionsLabels />
      </FilterDropDown>

      <FilterDropDown caption="Milestones" enabled={Object.keys(availableFilters.milestones).length > 0}>
        <OptionsMilestones />
      </FilterDropDown>

      <FilterDropDown caption="Status" enabled={Object.keys(availableFilters.statuses).length > 0}>
        <OptionsStatuses />
      </FilterDropDown>

      <div css={`padding: ${2 * GU}px`}>
        {activeFiltersCount > 0 && (
          <FilterBarActives>
            <ActiveFilters />
          </FilterBarActives>
        )}

        <Label text="Sort by" />
        {sortOptions.map(way => (
          <FilterMenuItem
            key={way}
            onClick={() => setSortBy(way)}
          >
            <div css={`width: ${3 * GU}px`}>
              {way === sortBy && <IconCheck color={`${theme.accent}`} />}
            </div>
            <ActionLabel>{way}</ActionLabel>
          </FilterMenuItem>
        ))}
      </div>
    </div>
  )
}

const FilterBarActives = styled.div`
  width: 100%;
  margin-bottom: ${2 * GU}px;
`
const FilterMenuItem = styled.a`
  display: flex;
  align-items: center;
  padding: 5px;
  padding-right: 10px;
  cursor: pointer;
`
const ActionLabel = styled.span`
  margin-left: ${GU}px;
`

export default Filters

