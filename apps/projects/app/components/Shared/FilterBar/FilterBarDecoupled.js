import React, { useCallback, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import {
  BackButton,
  Button,
  Bar,
  Checkbox,
  ContextMenuItem,
  GU,
  IconSearch,
  IconCheck,
  Popover,
  Text,
  TextInput,
  useLayout,
  useTheme,
} from '@aragon/ui'
import usePathHelpers from '../../../../../../shared/utils/usePathHelpers'
import { FilterDropDown, OverflowDropDown } from './FilterDropDown'
import ActiveFilters from '../../Content/Filters'
import prepareFilters from './prepareFilters'
import { IconArrow as IconArrowDown } from '../../../../../../shared/ui'
import { IconSort, IconGrid, IconCoins, IconFilter } from '../../../assets'
import { usePanelManagement } from '../../Panel'
import Label from '../../Content/IssueDetail/Label'
import { issueShape, repoShape } from '../../../utils/shapes.js'

const TextFilterInput = ({ textFilter, updateTextFilter }) => {
  const theme = useTheme()

  return (
    <TextInput
      placeholder="Search"
      type="search"
      onChange={updateTextFilter}
      value={textFilter}
      adornment={
        <IconSearch
          css={`
            color: ${theme.surfaceOpened};
            margin-right: ${GU}px;
          `}
        />
      }
      adornmentPosition="start"
      css="width: 228px"
    />
  )
}

TextFilterInput.propTypes = {
  textFilter: PropTypes.string.isRequired,
  updateTextFilter: PropTypes.func.isRequired,
}

const TextFilterPopover = ({ visible, opener, setVisible, textFilter, updateTextFilter }) => (
  <Popover
    visible={visible}
    opener={opener}
    onClose={() => setVisible(false)}
    css={`padding: ${1.5 * GU}px`}
    placement="bottom-end"
  >
    <TextFilterInput
      textFilter={textFilter}
      updateTextFilter={updateTextFilter}
    />
  </Popover>
)

TextFilterPopover.propTypes = {
  visible: PropTypes.bool.isRequired,
  opener: PropTypes.object,
  setVisible: PropTypes.func.isRequired,
  textFilter: PropTypes.string.isRequired,
  updateTextFilter: PropTypes.func.isRequired,
}

const TextFilter = ({ visible, setVisible, openerRef, onClick, textFilter, updateTextFilter }) => {
  const { layoutName } = useLayout()

  if (layoutName === 'large') return (
    <TextFilterInput
      textFilter={textFilter}
      updateTextFilter={updateTextFilter}
    />
  )
  return [
    <Button key="tf1" icon={<IconSearch />} display="icon" onClick={onClick} ref={openerRef} label="Text Filter" />,
    <TextFilterPopover
      key="tf2"
      visible={visible}
      opener={openerRef.current}
      setVisible={setVisible}
      textFilter={textFilter}
      updateTextFilter={updateTextFilter}
    />
  ]
}
TextFilter.propTypes = {
  visible: PropTypes.bool.isRequired,
  openerRef: PropTypes.object,
  setVisible: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  textFilter: PropTypes.string.isRequired,
  updateTextFilter: PropTypes.func.isRequired,
}

const SortPopover = ({
  visible,
  opener,
  setVisible,
  sortBy,
  sortOptions,
  updateSortBy,
}) => {
  const theme = useTheme()

  return (
    <Popover
      visible={visible}
      opener={opener}
      onClose={() => setVisible(false)}
      css={`padding: ${1.5 * GU}px`}
      placement="bottom-end"
    >
      <Label text="Sort by" />
      {Object.keys(sortOptions).map(way => (
        <FilterMenuItem
          key={way}
          onClick={updateSortBy(way)}
        >
          <div css={`width: ${3 * GU}px`}>
            {way === sortBy && <IconCheck color={`${theme.accent}`} />}
          </div>
          <ActionLabel>{sortOptions[way].name}</ActionLabel>
        </FilterMenuItem>
      ))}
    </Popover>
  )
}
SortPopover.propTypes = {
  visible: PropTypes.bool.isRequired,
  opener: PropTypes.object,
  setVisible: PropTypes.func.isRequired,
  sortBy: PropTypes.string.isRequired,
  sortOptions: PropTypes.object.isRequired,
  updateSortBy: PropTypes.func.isRequired,
}

const ActionsPopover = ({ visible, setVisible, openerRef, selectedIssues, issuesFiltered, deselectAllIssues }) => {
  const { curateIssues, allocateBounty } = usePanelManagement()

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
        <IconFilter />
        <ActionLabel>Curate issues</ActionLabel>
      </FilterMenuItem>
      <FilterMenuItem
        onClick={() => {
          allocateBounty(selectedIssues)
          deselectAllIssues()
          setVisible(false)
        }}
      >
        <IconCoins />
        <ActionLabel>Fund issues</ActionLabel>
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
  children: PropTypes.object.isRequired,
  filtersDisplayNumber: PropTypes.number.isRequired,
}

const FilterBarDecoupled = ({
  filters,
  bountyIssues,
  issues,
  issuesFiltered,
  handleFiltering,
  handleSorting,
  setParentFilters,
  disableFilter,
  disableAllFilters,
  deselectAllIssues,
  selectedIssues,
  onSearchChange,
  sortOptions,
  sortBy,
  repo,
}) => {
  const [ textFilter, setTextFilter ] = useState('')
  const [ sortMenuVisible, setSortMenuVisible ] = useState(false)
  const [ actionsMenuVisible, setActionsMenuVisible ] = useState(false)
  const [ textFilterVisible, setTextFilterVisible ] = useState(false)
  const [ filtersDisplayNumber, setFiltersDisplayNumber ] = useState(10)
  const theme = useTheme()
  const actionsOpener = useRef(null)
  const sortersOpener = useRef(null)
  const textFilterOpener = useRef(null)
  const leftFBRef = useRef(null)
  const rightFBRef = useRef(null)
  const activeFilters = () => {
    let count = 0
    const types = ['statuses']
    types.forEach(t => count += Object.keys(filters[t]).length)
    return count
  }

  const recalculateFiltersDisplayNumber = useCallback(() => {
    const widths = {
      dropdown: 128,
      margin: 8,
      overflow: 40,
    }

    const leftOffset = leftFBRef.current ? leftFBRef.current.offsetLeft : 0
    const rightOffset = rightFBRef.current ? rightFBRef.current.offsetLeft : 0
    const width = rightOffset - leftOffset - widths.overflow - widths.margin

    setFiltersDisplayNumber(Math.floor(
      width / (widths.dropdown + widths.margin + 1)
    ))
  }, [])

  useEffect(() => {
    window.addEventListener('resize', recalculateFiltersDisplayNumber)
    return () => {
      window.removeEventListener('resize', recalculateFiltersDisplayNumber)
    }
  }, [])

  useEffect(() => {
    recalculateFiltersDisplayNumber()
  }, [selectedIssues.length])

  const { requestPath } = usePathHelpers()

  const updateTextFilter = e => {
    setTextFilter(e.target.value)
    onSearchChange(e)
  }

  const noop = () => {}

  const filter = (type, id) => () => {
    if (id in filters[type]) delete filters[type][id]
    else filters[type][id] = true
    // filters are in local state because of checkboxes
    // and sent to the parent (Issues) for actual display change
    setParentFilters({ filters })
    handleFiltering(filters, filtersData)
  }

  const updateSortBy = way => () => {
    handleSorting(way)
    setSortMenuVisible(false)
  }

  const FilterByStatus = ({ filters, filtersData, allFundedIssues, allIssues }) => (
    <FilterDropDown
      caption="Status"
      enabled={Object.keys(filtersData.statuses).length > 0}
    >
      {allFundedIssues.map(status => (
        <FilterMenuItem
          key={status}
          onClick={filter('statuses', status)}
        >
          <div>
            <Checkbox
              onChange={noop}
              checked={status in filters.statuses}
            />
          </div>
          <ActionLabel>
            {filtersData.statuses[status].name}
          </ActionLabel>
        </FilterMenuItem>
      ))}
      <hr css={`
        height: 1px;
        border: 0;
        width: 100%;
        background: ${theme.border};
      `} />
      {allIssues.map(status => (
        <FilterMenuItem
          key={status}
          onClick={filter('statuses', status)}
        >
          <div>
            <Checkbox
              onChange={noop}
              checked={status in filters.statuses}
            />
          </div>
          <ActionLabel>
            {filtersData.statuses[status].name}
          </ActionLabel>
        </FilterMenuItem>
      ))}
    </FilterDropDown>
  )
  FilterByStatus.propTypes = {
    filters: PropTypes.object.isRequired,
    filtersData: PropTypes.object.isRequired,
    allFundedIssues: PropTypes.array.isRequired,
    allIssues: PropTypes.array.isRequired,
  }

  // filters contain information about active filters (checked checkboxes)
  // filtersData is about displayed checkboxes
  const allFundedIssues = [ 'funded', 'review-applicants', 'in-progress', 'review-work', 'fulfilled' ]
  const allIssues = [ 'all-funded', 'not-funded' ]
  const filtersData = prepareFilters(issues, bountyIssues, repo)

  const actionsClickHandler = () =>
    selectedIssues.length && setActionsMenuVisible(true)

  const activateTextFilter = () => setTextFilterVisible(true)
  const activateSort = () => setSortMenuVisible(true)

  return (
    <>
      <Bar
        primary={
          <>
            <BackButton onClick={() => requestPath('/')} />
            <FilterBarMainLeft ref={leftFBRef}>
              <Overflow filtersDisplayNumber={filtersDisplayNumber}>
                <FilterByStatus
                  filters={filters}
                  filtersData={filtersData}
                  allFundedIssues={allFundedIssues}
                  allIssues={allIssues}
                />
              </Overflow>
            </FilterBarMainLeft>
          </>
        }
        secondary={
          <FilterBarMainRight ref={rightFBRef}>
            <TextFilter
              onClick={activateTextFilter}
              textFilter={textFilter}
              updateTextFilter={updateTextFilter}
              visible={textFilterVisible}
              openerRef={textFilterOpener}
              setVisible={setTextFilterVisible}
            />

            <Button icon={<IconSort />} display="icon" onClick={activateSort} ref={sortersOpener} label="Sort by" />
            <SortPopover
              visible={sortMenuVisible}
              opener={sortersOpener.current}
              setVisible={setSortMenuVisible}
              sortBy={sortBy}
              sortOptions={sortOptions}
              updateSortBy={updateSortBy}
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
        }
      />

      {activeFilters() > 0 && (
        <FilterBarActives>
          <ActiveFilters
            issues={issues}
            bountyIssues={bountyIssues}
            filters={filters}
            disableFilter={disableFilter}
            disableAllFilters={disableAllFilters}
            repo={repo}
          />
        </FilterBarActives>
      )}
    </>
  )
}

FilterBarDecoupled.propTypes = {
  filters: PropTypes.object.isRequired,
  bountyIssues: PropTypes.arrayOf(issueShape).isRequired,
  issues: PropTypes.arrayOf(issueShape).isRequired,
  issuesFiltered: PropTypes.arrayOf(issueShape).isRequired,
  handleFiltering: PropTypes.func.isRequired,
  handleSorting: PropTypes.func.isRequired,
  setParentFilters: PropTypes.func.isRequired,
  disableFilter: PropTypes.func.isRequired,
  disableAllFilters: PropTypes.func.isRequired,
  selectedIssues: PropTypes.arrayOf(issueShape).isRequired,
  onSearchChange: PropTypes.func.isRequired,
  deselectAllIssues: PropTypes.func.isRequired,
  sortBy: PropTypes.string.isRequired,
  sortOptions: PropTypes.object.isRequired,
  repo: repoShape,
}

const FilterMenuItem = styled(ContextMenuItem)`
  display: flex;
  align-items: center;
  padding: 5px;
  padding-right: 10px;
`
const ActionLabel = styled.span`
  margin-left: 8px;
`

const FilterBarMainLeft = styled.div`
  width: 100%;
  display: flex;
  margin-left: ${GU}px;
  > * {
    margin-right: ${GU}px;
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
  margin-bottom: ${2 * GU}px;
  width: 100%;
`
export default FilterBarDecoupled
