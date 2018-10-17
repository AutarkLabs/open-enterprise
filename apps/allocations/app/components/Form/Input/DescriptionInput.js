import PropTypes from 'prop-types'
import styled from 'styled-components'
import { TextInput, theme } from '@aragon/ui'

const DescriptionInput = styled(TextInput.Multiline).attrs({
  wide: true,
})`
  resize: none; /* TODO: Should we have the ability to resize the form? */
  height: 75px;
  ::placeholder {
    color: ${theme.contentBorderActive};
  }
  :focus {
    border-color: ${theme.contentBorderActive};
    ::placeholder {
      color: ${theme.contentBorderActive};
    }
  }
`

DescriptionInput.propTypes = {
  rows: PropTypes.string,
  placeholder: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
}

export default DescriptionInput
