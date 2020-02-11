import React, { useCallback, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import {
  BackButton,
  Button,
  Bar,
  ContextMenuItem,
  GU,
  IconCheck,
  Popover,
  Text,
  useLayout,
  useTheme,
} from '@aragon/ui'
import usePathHelpers from '../../../../../../shared/utils/usePathHelpers'
import { FilterDropDown, OverflowDropDown } from './FilterDropDown'
import { IconArrow as IconArrowDown } from '../../../../../../shared/ui'
import { IconSort, IconGrid, IconCoins, IconFilter } from '../../../assets'
import { usePanelManagement } from '../../Panel'
import Label from '../../Content/IssueDetail/Label'
import {
  OptionsLabels,
  OptionsStatuses,
} from './FilterOptions'
import ActiveFilters from './ActiveFilters'
import { sortOptions, useIssueFilters } from '../../../context/IssueFilters'
import { TextFilter } from './TextFilter'

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
      {Object.keys(sortOptions).map(way => (
        <FilterMenuItem
          key={way}
          onClick={() => {
            setSortBy(way)
            setVisible(false)
          }}
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
}

const ActionsPopover = ({ visible, setVisible, openerRef }) => {
  const { curateIssues, allocateBounty } = usePanelManagement()
  const { selectedIssues, deselectAllIssues, filteredIssues } = useIssueFilters()
  const selectedIssuesList = Object.keys(selectedIssues).map(
    id => selectedIssues[id]
  )

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
          curateIssues(selectedIssuesList, filteredIssues)
          deselectAllIssues()
          setVisible(false)
        }}
      >
        <IconFilter />
        <ActionLabel>Curate issues</ActionLabel>
      </FilterMenuItem>
      <FilterMenuItem
        onClick={() => {
          allocateBounty(selectedIssuesList)
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
}

const Actions = ({ onClick, openerRef, visible, setVisible }) => {
  const { layoutName } = useLayout()
  const { selectedIssues } = useIssueFilters()

  if (!Object.keys(selectedIssues).length) return null

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
        visible={visible}
        setVisible={setVisible}
      />
    </React.Fragment>
  )
}
Actions.propTypes = {
  onClick: PropTypes.func.isRequired,
  visible: PropTypes.bool.isRequired,
  setVisible: PropTypes.func.isRequired,
  openerRef: PropTypes.object.isRequired,
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

const FilterBar = () => {
  const [ sortMenuVisible, setSortMenuVisible ] = useState(false)
  const [ actionsMenuVisible, setActionsMenuVisible ] = useState(false)
  const [ filtersDisplayNumber, setFiltersDisplayNumber ] = useState(10)
  const actionsOpener = useRef(null)
  const sortersOpener = useRef(null)
  const leftFBRef = useRef(null)
  const rightFBRef = useRef(null)

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

  const { availableFilters, activeFiltersCount, selectedIssues } = useIssueFilters()

  useEffect(() => {
    recalculateFiltersDisplayNumber()
  }, [Object.keys(selectedIssues).length])

  const { requestPath } = usePathHelpers()

  const actionsClickHandler = () =>
    Object.keys(selectedIssues).length && setActionsMenuVisible(true)

  const activateSort = () => setSortMenuVisible(true)

  return (
    <>
      <Bar
        primary={
          <>
            <BackButton onClick={() => requestPath('/')} />
            <FilterBarMainLeft ref={leftFBRef}>
              <Overflow filtersDisplayNumber={filtersDisplayNumber}>
                <FilterDropDown caption="Status" enabled={Object.keys(availableFilters.statuses).length > 0}>
                  <OptionsStatuses />
                </FilterDropDown>

                <FilterDropDown caption="Labels" enabled={Object.keys(availableFilters.labels).length > 0}>
                  <OptionsLabels />
                </FilterDropDown>

              </Overflow>
            </FilterBarMainLeft>
          </>
        }
        secondary={
          <FilterBarMainRight ref={rightFBRef}>
            <TextFilter />

            <Button icon={<IconSort />} display="icon" onClick={activateSort} ref={sortersOpener} label="Sort by" />
            <SortPopover
              visible={sortMenuVisible}
              opener={sortersOpener.current}
              setVisible={setSortMenuVisible}
            />

            <Actions
              onClick={actionsClickHandler}
              visible={actionsMenuVisible}
              setVisible={setActionsMenuVisible}
              openerRef={actionsOpener}
            />

          </FilterBarMainRight>
        }
      />

      {activeFiltersCount > 0 && (
        <FilterBarActives>
          <ActiveFilters />
        </FilterBarActives>
      )}

    </>
  )
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
export default FilterBar
