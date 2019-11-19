import React from 'react'
import PropTypes from 'prop-types'
import {
  Button,
  GU,
  IconSearch,
  Popover,
  TextInput,
  useLayout,
  useTheme,
} from '@aragon/ui'
import { useIssueFilters } from '../../../context/IssueFilters'

const TextFilterInput = () => {
  const theme = useTheme()
  const { textFilter, updateTextFilter } = useIssueFilters()
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

const TextFilterPopover = ({ visible, opener, setVisible }) => (
  <Popover
    visible={visible}
    opener={opener}
    onClose={() => setVisible(false)}
    css={`padding: ${1.5 * GU}px`}
    placement="bottom-end"
  >
    <TextFilterInput />
  </Popover>
)
TextFilterPopover.propTypes = {
  visible: PropTypes.bool.isRequired,
  opener: PropTypes.object,
  setVisible: PropTypes.func.isRequired,
}

export const TextFilter = ({ visible, setVisible, openerRef, onClick }) => {
  const { layoutName } = useLayout()

  if (layoutName === 'large') return (
    <TextFilterInput />
  )
  return (
    <>
      <Button icon={<IconSearch />} display="icon" onClick={onClick} ref={openerRef} label="Text Filter" />
      <TextFilterPopover
        visible={visible}
        opener={openerRef.current}
        setVisible={setVisible}
      />
    </>
  )
}
TextFilter.propTypes = {
  visible: PropTypes.bool.isRequired,
  openerRef: PropTypes.object,
  setVisible: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
}
