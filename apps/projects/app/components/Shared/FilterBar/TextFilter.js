import React, { useRef, useState } from 'react'
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

export const TextFilter = () => {
  const { layoutName } = useLayout()
  const openerRef = useRef()
  const [ visible, setVisible ] = useState(false)

  if (layoutName === 'large') return (
    <TextFilterInput />
  )
  return (
    <>
      <Button
        display="icon"
        icon={<IconSearch />}
        label="Text Filter"
        onClick={() => setVisible(!visible)}
        ref={openerRef}
      />
      <TextFilterPopover
        visible={visible}
        opener={openerRef.current}
        setVisible={setVisible}
      />
    </>
  )
}
