import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Text, theme, SidePanelSeparator } from '@aragon/ui'

import { FieldTitle } from '.'

const FormField = ({ input, label, hint, required, separator }) => {
  // TODO: Currently it will only work with 1 required child
  // const isRequired = React.Children.toArray(children).some(
  //   ({ props: childProps }) => childProps.required
  // )

  return (
    <StyledField>
      <FieldTitle>
        {label && <Text color={theme.textTertiary}>{label}</Text>}
        {required && <StyledAsterisk title="Required">*</StyledAsterisk>}
      </FieldTitle>
      {hint && <StyledHint>{hint}</StyledHint>}
      {input}
      {separator && <SidePanelSeparator style={{ marginTop: '1rem' }} />}
    </StyledField>
  )
}

FormField.propTypes = {
  children: PropTypes.node,
  label: PropTypes.string,
  required: PropTypes.bool,
  hint: PropTypes.string,
  seeparator: PropTypes.bool,
}

const StyledField = styled.div`
  margin-bottom: 1rem;
`

const StyledAsterisk = styled.span`
  color: ${theme.accent};
  margin-left: 0.3rem;
  font-size: 0.6rem;
`

export const StyledHint = styled.span`
  display: block;
  opacity: 0.75;
  color: ${theme.textTertiary};
  font-size: 0.6rem;
  font-weight: 300;
  line-height: 24px;
`

export default FormField
