import React, { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import {
  Button,
  Card,
  Checkbox,
  ContextMenuItem,
  IconSearch,
  IconCheck,
  Popover,
  Tag,
  Text,
  TextInput,
  useLayout,
  useTheme,
} from '@aragon/ui'
import FilterDropDown from './FilterDropDown'
import ActiveFilters from '../../Content/Filters'
import prepareFilters from './prepareFilters'
import { IconArrow as IconArrowDown } from '../../../../../../shared/ui'
import { IconSort, IconGrid, IconCoins, IconFilter } from '../../../assets'
import { usePanelManagement } from '../../Panel'
import Label from '../../Content/IssueDetail/Label'
import { issueShape } from '../../../utils/shapes.js'

const SearchInput = ({ textFilter, updateTextFilter }) => {
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
            margin-right: 8px;
          `}
        />
      }
      adornmentPosition="start"
      css="width: 256px"
    />
  )
}

SearchInput.propTypes = {
  textFilter: PropTypes.string.isRequired,
  updateTextFilter: PropTypes.func.isRequired,
}

const SearchPopover = ({ visible, opener, setSearchVisible, textFilter, updateTextFilter }) => (
  <Popover
    visible={visible}
    opener={opener}
    onClose={() => setSearchVisible(false)}
    css="padding: 12px"
    placement="bottom-end"
  >
    <SearchInput
      textFilter={textFilter}
      updateTextFilter={updateTextFilter}
    />
  </Popover>
)

SearchPopover.propTypes = {
  visible: PropTypes.bool.isRequired,
  opener: PropTypes.object,
  setSearchVisible: PropTypes.func.isRequired,
  textFilter: PropTypes.string.isRequired,
  updateTextFilter: PropTypes.func.isRequired,
}

const SortPopover = ({ visible, opener, setSortMenuVisible, sortBy, updateSortBy }) => {
  const theme = useTheme()
  const sorters = [
    'Name ascending',
    'Name descending',
    'Newest',
    'Oldest',
  ]

  return (
    <Popover
      visible={visible}
      opener={opener}
      onClose={() => setSortMenuVisible(false)}
      css="padding: 12px"
      placement="bottom-start"
    >
      <Label text="Sort by" />
      {sorters.map(way => (
        <FilterMenuItem
          key={way}
          onClick={updateSortBy(way)}
        >
          <div css="width: 24px">
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
  setSortMenuVisible: PropTypes.func.isRequired,
  sortBy: PropTypes.string.isRequired,
  updateSortBy: PropTypes.func.isRequired,
}

const FilterBar = ({
  allSelected,
  filters,
  bountyIssues,
  issues,
  issuesFiltered,
  handleSelectAll,
  handleFiltering,
  handleSorting,
  setParentFilters,
  disableFilter,
  disableAllFilters,
  deselectAllIssues,
  selectedIssues,
  onSearchChange,
}) => {

  // Complete list of sorters for DropDown. Parent has only one item, to perform actual sorting.
  const [ sortBy, setSortBy ] = useState('Newest')

  const [ textFilter, setTextFilter ] = useState('')
  const { layoutName } = useLayout()
  const [ sortMenuVisible, setSortMenuVisible ] = useState(false)
  const [ actionsMenuVisible, setActionsMenuVisible ] = useState(false)
  const [ searchVisible, setSearchVisible ] = useState(false)
  const { curateIssues, allocateBounty } = usePanelManagement()
  const theme = useTheme()
  const actionsOpener = useRef(null)
  const sortersOpener = useRef(null)
  const searchOpener = useRef(null)
  const activeFilters = () => {
    let count = 0
    const types = [ 'projects', 'labels', 'milestones', 'statuses' ]
    types.forEach(t => count += Object.keys(filters[t]).length)
    return count
  }

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
    handleFiltering(filters)
  }

  const updateSortBy = way => () => {
    handleSorting(way)
    setSortBy(way)
    setSortMenuVisible(false)
  }

  const FilterByProject = ({ filters, filtersData }) => (
    <FilterDropDown
      caption="Projects"
      enabled={Object.keys(filtersData.projects).length > 0}
    >
      {Object.keys(filtersData.projects)
        .sort(
          (p1, p2) =>
            filtersData.projects[p1].name < filtersData.projects[p2].name
              ? -1
              : 1
        )
        .map(id => (
          <FilterMenuItem
            key={id}
            onClick={filter('projects', id)}
          >
            <div>
              <Checkbox
                onChange={noop}
                checked={id in filters.projects}
              />
            </div>
            <ActionLabel>
              {filtersData.projects[id].name} (
              {filtersData.projects[id].count})
            </ActionLabel>
          </FilterMenuItem>
        ))}
    </FilterDropDown>
  )
  FilterByProject.propTypes = {
    filters: PropTypes.object.isRequired,
    filtersData: PropTypes.object.isRequired,
  }

  const FilterByLabel = ({ filters, filtersData, type }) => (
    <FilterDropDown
      caption="Labels"
      enabled={Object.keys(filtersData.labels).length > 0}
      type={type}
    >
      {Object.keys(filtersData.labels)
        .sort((l1, l2) => {
          if (l1 === 'labelless') return -1
          if (l2 === 'labelless') return 1
          return filtersData.labels[l1].name < filtersData.labels[l2].name
            ? -1
            : 1
        })
        .map(id => (
          <FilterMenuItem
            key={id}
            onClick={filter('labels', id)}
          >
            <div>
              <Checkbox
                onChange={noop}
                checked={id in filters.labels}
              />
            </div>
            <ActionLabel>
              <Tag
                background={'#' + filtersData.labels[id].color + '99'}
                color={`${theme.surfaceContent}`}
                uppercase={false}
              >
                {filtersData.labels[id].name}
              </Tag>{' '}
            ({filtersData.labels[id].count})
            </ActionLabel>
          </FilterMenuItem>
        ))}
    </FilterDropDown>
  )
  FilterByLabel.propTypes = {
    filters: PropTypes.object.isRequired,
    filtersData: PropTypes.object.isRequired,
    type: PropTypes.string.isRequired,
  }
  FilterByLabel.defaultProps = {
    type: 'filter',
  }

  const FilterByMilestone = ({ filters, filtersData, type }) => (
    <FilterDropDown
      caption="Milestones"
      enabled={Object.keys(filtersData.milestones).length > 0}
      type={type}
    >
      {Object.keys(filtersData.milestones)
        .sort((m1, m2) => {
          if (m1 === 'milestoneless') return -1
          if (m2 === 'milestoneless') return 1
          return filtersData.milestones[m1].title <
        filtersData.milestones[m2].title
            ? -1
            : 1
        })
        .map(id => (
          <FilterMenuItem
            key={id}
            onClick={filter('milestones', id)}
          >
            <div>
              <Checkbox
                onChange={noop}
                checked={id in filters.milestones}
              />
            </div>
            <ActionLabel>
              {filtersData.milestones[id].title} (
              {filtersData.milestones[id].count})
            </ActionLabel>
          </FilterMenuItem>
        ))}
    </FilterDropDown>
  )
  FilterByMilestone.propTypes = {
    filters: PropTypes.object.isRequired,
    filtersData: PropTypes.object.isRequired,
    type: PropTypes.string.isRequired,
  }
  FilterByMilestone.defaultProps = {
    type: 'filter',
  }

  const FilterByStatus = ({ filters, filtersData, allFundedIssues, allIssues, type }) => (
    <FilterDropDown
      caption="Status"
      enabled={Object.keys(filtersData.statuses).length > 0}
      type={type}
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
            {filtersData.statuses[status].name} (
            {filtersData.statuses[status].count})
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
            {filtersData.statuses[status].name} (
            {filtersData.statuses[status].count})
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
    type: PropTypes.string.isRequired,
  }
  FilterByStatus.defaultProps = {
    type: 'filter',
  }

  const ActionsPopover = ({ selectedIssues, issuesFiltered }) => (
    <Popover
      visible={actionsMenuVisible}
      opener={actionsOpener.current}
      onClose={() => setActionsMenuVisible(false)}
      placement="bottom-end"
      css={`
        display: flex;
        flex-direction: column;
        padding: 10px;
      `}
    >
      <FilterMenuItem
        key="1"
        onClick={() => {
          curateIssues(selectedIssues, issuesFiltered)
          deselectAllIssues()
          setActionsMenuVisible(false)
        }}
      >
        <IconFilter />
        <ActionLabel>Curate Issues</ActionLabel>
      </FilterMenuItem>
      <FilterMenuItem
        key="2"
        onClick={() => {
          allocateBounty(selectedIssues)
          deselectAllIssues()
          setActionsMenuVisible(false)
        }}
      >
        <IconCoins />
        <ActionLabel>Fund Issues</ActionLabel>
      </FilterMenuItem>
    </Popover>
  )

  // filters contain information about active filters (checked checkboxes)
  // filtersData is about displayed checkboxes
  const allFundedIssues = [ 'funded', 'review-applicants', 'in-progress', 'review-work', 'fulfilled' ]
  const allIssues = [ 'all-funded', 'not-funded' ]
  const filtersData = prepareFilters(issues, bountyIssues)

  const actionsClickHandler = () =>
    selectedIssues.length && setActionsMenuVisible(true)

  const actionsButtonBg = () =>
    'background-color: ' + (!selectedIssues.length ? `${theme.background}` : `${theme.surface}`)

  const activateSearch = () => setSearchVisible(true)
  const activateSort = () => setSortMenuVisible(true)

  return (
    <FilterBarCard>
      <FilterBarMain>
        <FilterBarMainLeft>
          <SelectAll>
            <Checkbox onChange={handleSelectAll} checked={allSelected} />
          </SelectAll>

          {layoutName === 'large' ? (
            <React.Fragment>
              <FilterByProject filters={filters} filtersData={filtersData} />
              <FilterByLabel filters={filters} filtersData={filtersData} />
              <FilterByMilestone filters={filters} filtersData={filtersData} />
              <FilterByStatus
                filters={filters}
                filtersData={filtersData}
                allFundedIssues={allFundedIssues}
                allIssues={allIssues}
              />
            </React.Fragment>
          ) : (
            layoutName === 'medium' ? (
              <React.Fragment>
                <FilterByProject filters={filters} filtersData={filtersData} />
                <FilterByLabel filters={filters} filtersData={filtersData} />
                <FilterByMilestone filters={filters} filtersData={filtersData} />
                <FilterDropDown type="overflow">
                  <FilterByStatus
                    filters={filters}
                    filtersData={filtersData}
                    allFundedIssues={allFundedIssues}
                    allIssues={allIssues}
                  />
                </FilterDropDown>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <FilterByProject filters={filters} filtersData={filtersData} />
                <FilterByLabel filters={filters} filtersData={filtersData} />
                <FilterDropDown type="overflow">
                  <FilterByMilestone
                    filters={filters}
                    filtersData={filtersData}
                    type="overflowTop"
                  />
                  <FilterByStatus
                    filters={filters}
                    filtersData={filtersData}
                    allFundedIssues={allFundedIssues}
                    allIssues={allIssues}
                    type="overflowBottom"
                  />
                </FilterDropDown>
              </React.Fragment>
            )
          )}
        </FilterBarMainLeft>

        <FilterBarMainRight>
          {layoutName === 'large' ? (
            <SearchInput
              textFilter={textFilter}
              updateTextFilter={updateTextFilter}
            />
          ) : (
            <React.Fragment>
              <Button icon={<IconSearch />} display="icon" onClick={activateSearch} ref={searchOpener} />
              <SearchPopover
                visible={searchVisible}
                opener={searchOpener.current}
                setSearchVisible={setSearchVisible}
                textFilter={textFilter}
                updateTextFilter={updateTextFilter}
              />
            </React.Fragment>
          )}

          <Button icon={<IconSort />} display="icon" onClick={activateSort} ref={sortersOpener} />
          <SortPopover
            visible={sortMenuVisible}
            opener={sortersOpener.current}
            setSortMenuVisible={setSortMenuVisible}
            sortBy={sortBy}
            updateSortBy={updateSortBy}
          />

          {layoutName === 'large' ? (
            <Button
              css={actionsButtonBg()}
              onClick={actionsClickHandler}
              ref={actionsOpener}
            >
              <IconGrid />
              <Text css="margin: 0 8px;">Actions</Text>
              <IconArrowDown />
            </Button>
          ) : (
            <Button
              css={actionsButtonBg()}
              icon={<IconGrid />}
              display="icon"
              onClick={actionsClickHandler}
              ref={actionsOpener}
            />
          )}
          <ActionsPopover selectedIssues={selectedIssues} issuesFiltered={issuesFiltered} />

        </FilterBarMainRight>
      </FilterBarMain>

      {activeFilters() > 0 && (
        <FilterBarActives>
          <ActiveFilters
            issues={issues}
            bountyIssues={bountyIssues}
            filters={filters}
            disableFilter={disableFilter}
            disableAllFilters={disableAllFilters}
          />
        </FilterBarActives>
      )}

    </FilterBarCard>
  )
}

FilterBar.propTypes = {
  allSelected: PropTypes.bool.isRequired,
  filters: PropTypes.object.isRequired,
  bountyIssues: PropTypes.arrayOf(issueShape).isRequired,
  issues: PropTypes.arrayOf(issueShape).isRequired,
  issuesFiltered: PropTypes.arrayOf(issueShape).isRequired,
  sortBy: PropTypes.string.isRequired,
  handleSelectAll: PropTypes.func.isRequired,
  handleFiltering: PropTypes.func.isRequired,
  handleSorting: PropTypes.func.isRequired,
  setParentFilters: PropTypes.func.isRequired,
  disableFilter: PropTypes.func.isRequired,
  disableAllFilters: PropTypes.func.isRequired,
  selectedIssues: PropTypes.arrayOf(issueShape).isRequired,
  onSearchChange: PropTypes.func.isRequired,
  deselectAllIssues: PropTypes.func.isRequired,
}

const FilterMenuItem = styled(ContextMenuItem)`
  display: flex;
  align-items: center;
  padding: 5px;
  padding-right: 10px;
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
`
const FilterBarMain = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
`
const FilterBarMainLeft = styled.div`
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
