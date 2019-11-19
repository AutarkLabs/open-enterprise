import React, { useCallback, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import {
  Button,
  Card,
  Checkbox,
  GU,
  IconCheck,
  IconCoin,
  IconConfiguration,
  Popover,
  Text,
  useLayout,
  useTheme,
} from '@aragon/ui'
import { FilterDropDown, OverflowDropDown } from './FilterDropDown'
import {
  OptionsProjects,
  OptionsLabels,
  OptionsMilestones,
  OptionsStatuses,
} from './FilterOptions'
import ActiveFilters from './ActiveFilters'
import { IconArrow as IconArrowDown } from '../../../../../../shared/ui'
import { IconSort, IconGrid } from '../../../assets'
import { usePanelManagement } from '../../Panel'
import Label from '../../Content/IssueDetail/Label'
import { issueShape } from '../../../utils/shapes.js'
import { sortOptions, useIssueFilters } from '../../../context/IssueFilters'
import { TextFilter } from './TextFilter'

const noop = () => {}

const SortPopover = ({ visible, opener, setVisible }) => {
  const theme = useTheme()
  const { sortBy, setSortBy } = useIssueFilters()

  return (
    <Popover
      visible={visible}
      opener={opener}
      onClose={() => setVisible(false)}
      css={`padding: ${1.5 * GU}px`}
      placement="bottom-end"
    >
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
    </Popover>
  )
}
SortPopover.propTypes = {
  visible: PropTypes.bool.isRequired,
  opener: PropTypes.object,
  setVisible: PropTypes.func.isRequired,
}

const ActionsPopover = ({ visible, setVisible, openerRef, selectedIssues, issuesFiltered, deselectAllIssues }) => {
  const { curateIssues, allocateBounty } = usePanelManagement()
  const theme = useTheme()

  return (
    <Popover
      visible={visible}
      opener={openerRef.current}
      onClose={() => setVisible(false)}
      placement="bottom-end"
      css={`
        display: flex;
        flex-direction: column;
        padding: 10px;
      `}
    >
      <FilterMenuItem
        onClick={() => {
          curateIssues(selectedIssues, issuesFiltered)
          deselectAllIssues()
          setVisible(false)
        }}
      >
        <IconConfiguration css={`color: ${theme.surfaceIcon};`} />
        <ActionLabel>Curate Issues</ActionLabel>
      </FilterMenuItem>
      <FilterMenuItem
        onClick={() => {
          allocateBounty(selectedIssues)
          deselectAllIssues()
          setVisible(false)
        }}
      >
        <IconCoin css={`color: ${theme.surfaceIcon};`} />
        <ActionLabel>Fund Issues</ActionLabel>
      </FilterMenuItem>
    </Popover>
  )
}
ActionsPopover.propTypes = {
  visible: PropTypes.bool.isRequired,
  setVisible: PropTypes.func.isRequired,
  openerRef: PropTypes.object.isRequired,
  selectedIssues: PropTypes.arrayOf(issueShape).isRequired,
  issuesFiltered: PropTypes.arrayOf(issueShape).isRequired,
  deselectAllIssues: PropTypes.func.isRequired,
}

const Actions = ({ onClick, openerRef, visible, setVisible, selectedIssues, issuesFiltered, deselectAllIssues }) => {
  const { layoutName } = useLayout()

  if (!selectedIssues.length) return null

  return (
    <React.Fragment>
      {layoutName === 'large' ? (
        <Button onClick={onClick} ref={openerRef}>
          <IconGrid />
          <Text css="margin: 0 8px;">Actions</Text>
          <IconArrowDown />
        </Button>
      ) : (
        <Button
          onClick={onClick}
          ref={openerRef}
          icon={<IconGrid />}
          display="icon"
          label="Actions Menu"
        />
      )}
      <ActionsPopover
        openerRef={openerRef}
        onClick={onClick}
        selectedIssues={selectedIssues}
        issuesFiltered={issuesFiltered}
        visible={visible}
        setVisible={setVisible}
        deselectAllIssues={deselectAllIssues}
      />
    </React.Fragment>
  )
}
Actions.propTypes = {
  onClick: PropTypes.func.isRequired,
  visible: PropTypes.bool.isRequired,
  setVisible: PropTypes.func.isRequired,
  openerRef: PropTypes.object.isRequired,
  selectedIssues: PropTypes.arrayOf(issueShape).isRequired,
  issuesFiltered: PropTypes.arrayOf(issueShape).isRequired,
  deselectAllIssues: PropTypes.func.isRequired,
}

const Overflow = ({ children, filtersDisplayNumber }) => {
  const childrenArray = React.Children.toArray(children)
  const elements = childrenArray.slice(0, filtersDisplayNumber)

  if (childrenArray.length > filtersDisplayNumber) {
    elements.push(
      <OverflowDropDown key="overflow" type="overflow">
        {childrenArray.slice(filtersDisplayNumber)}
      </OverflowDropDown>
    )
  }
  return elements
}
Overflow.propTypes = {
  children: PropTypes.array.isRequired,
  filtersDisplayNumber: PropTypes.number.isRequired,
}

const FilterBar = ({
  allSelected,
  issuesFiltered,
  handleSelectAll,
  deselectAllIssues,
  selectedIssues,
}) => {
  const [ sortMenuVisible, setSortMenuVisible ] = useState(false)
  const [ actionsMenuVisible, setActionsMenuVisible ] = useState(false)
  const [ textFilterVisible, setTextFilterVisible ] = useState(false)
  const [ filtersDisplayNumber, setFiltersDisplayNumber ] = useState(10)
  const actionsOpener = useRef(null)
  const sortersOpener = useRef(null)
  const textFilterOpener = useRef(null)
  const mainFBRef = useRef(null)
  const rightFBRef = useRef(null)
  const { availableFilters, activeFiltersCount } = useIssueFilters()

  const recalculateFiltersDisplayNumber = useCallback(() => {
    const total = mainFBRef.current ? mainFBRef.current.offsetWidth : 0
    const right = rightFBRef.current ? rightFBRef.current.offsetWidth : 0
    const width = total - (right + 120)
    const filtersToDisplay = Math.floor(width / (128+GU))
    setFiltersDisplayNumber(filtersToDisplay)
  }, [])

  useEffect(() => {
    recalculateFiltersDisplayNumber()
    window.addEventListener('resize', recalculateFiltersDisplayNumber)
    return () => {
      window.removeEventListener('resize', recalculateFiltersDisplayNumber)
    }
  }, [])

  const actionsClickHandler = () =>
    selectedIssues.length && setActionsMenuVisible(true)

  const activateTextFilter = () => setTextFilterVisible(true)
  const activateSort = () => setSortMenuVisible(true)

  return (
    <FilterBarCard>
      <FilterBarMain ref={mainFBRef}>
        <FilterBarMainLeft>
          <SelectAll>
            <Checkbox onChange={handleSelectAll} checked={allSelected} />
          </SelectAll>

          <Overflow filtersDisplayNumber={filtersDisplayNumber}>
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
          </Overflow>
        </FilterBarMainLeft>

        <FilterBarMainRight ref={rightFBRef}>
          <TextFilter
            onClick={activateTextFilter}
            visible={textFilterVisible}
            openerRef={textFilterOpener}
            setVisible={setTextFilterVisible}
          />

          <Button icon={<IconSort />} display="icon" onClick={activateSort} ref={sortersOpener} label="Sort by" />
          <SortPopover visible={sortMenuVisible} opener={sortersOpener.current} setVisible={setSortMenuVisible}
          />

          <Actions
            onClick={actionsClickHandler}
            visible={actionsMenuVisible}
            setVisible={setActionsMenuVisible}
            openerRef={actionsOpener}
            selectedIssues={selectedIssues}
            issuesFiltered={issuesFiltered}
            deselectAllIssues={deselectAllIssues}
          />

        </FilterBarMainRight>
      </FilterBarMain>

      {activeFiltersCount > 0 && (
        <FilterBarActives>
          <ActiveFilters />
        </FilterBarActives>
      )}

    </FilterBarCard>
  )
}

FilterBar.propTypes = {
  allSelected: PropTypes.bool.isRequired,
  issuesFiltered: PropTypes.arrayOf(issueShape).isRequired,
  handleSelectAll: PropTypes.func.isRequired,
  selectedIssues: PropTypes.arrayOf(issueShape).isRequired,
  deselectAllIssues: PropTypes.func.isRequired,
}
FilterBar.defaultProps = {
  allSelected: false,
  issuesFiltered: [],
  handleSelectAll: noop,
  disableAllFilters: noop,
  selectedIssues: [],
  deselectAllIssues: noop,
}

const FilterMenuItem = styled.a`
  display: flex;
  align-items: center;
  padding: 5px;
  padding-right: 10px;
  cursor: pointer;
`
const SelectAll = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 4px 12px 4px 4px;
`
const ActionLabel = styled.span`
  margin-left: 8px;
`

const FilterBarCard = styled(Card)`
  width: 100%;
  height: auto;
  padding: 12px;
  margin-bottom: 16px;
  @media only screen and (max-width: 514px) {
    display: none;
  }
`
const FilterBarMain = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
`
const FilterBarMainLeft = styled.div`
  width: 100%;
  display: flex;
  > * {
    margin-right: 8px;
  }
`
const FilterBarMainRight = styled.div`
  display: flex;
  > * {
    margin-left: 8px;
  }
`
const FilterBarActives = styled.div`
  margin: 0;
  margin-top: 12px;
  width: 100%;
  padding-left: 36px;
`
export default FilterBar
