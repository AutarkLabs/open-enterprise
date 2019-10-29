import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { TextInput as AragonTextInput, useTheme } from '@aragon/ui'
import Slider from '../../Slider'
import LocalIdentityBadge from '../../LocalIdentityBadge/LocalIdentityBadge'

const Label = styled.div`
  width: 100%;
`

const Inputs = styled.div`
  display: flex;
  margin: 0.5rem 0 1rem 0;
  justify-content: space-between;
  width: 100%;
`

const TextInput = styled(AragonTextInput).attrs({
  inputMode: 'numeric',
  pattern: '[0-9]*',
})`
  border-radius: 3px;
  border: 1px solid ${({ theme }) => theme.surfaceIcon};
  box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.03);
  height: 40px;
  text-align: center;
  width: 69px;
  ::-webkit-inner-spin-button,
  ::-webkit-outer-spin-button {
    appearance: none;
    margin: 0;
  }
`

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`

const EditVoteOption = ({
  onUpdate,
  option,
  optionIndex,
  vote,
}) => {
  const theme = useTheme()
  return (
    <Wrap>
      <Label>
        <LocalIdentityBadge
          compact
          entity={vote.data.options[optionIndex].label}
          fontSize="small"
          shorten
        />
      </Label>
      <Inputs>
        <Slider
          onUpdate={value => onUpdate(value * 100, optionIndex)}
          value={(option.sliderValue || 0) / 100}
        />
        <TextInput
          type="number"
          theme={theme}
          value={option.trueValue || 0}
          onChange={e => {
            onUpdate(parseInt(e.target.value, 10), optionIndex)
          }}
        />
      </Inputs>
    </Wrap>
  )
}

EditVoteOption.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  option: PropTypes.shape({
    sliderValue: PropTypes.number,
    trueValue: PropTypes.number,
  }).isRequired,
  optionIndex: PropTypes.number.isRequired,
  vote: PropTypes.object.isRequired,
}

export default EditVoteOption
