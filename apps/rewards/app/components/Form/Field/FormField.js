import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Help, SidePanelSeparator, Text, theme, } from '@aragon/ui'

import { FieldTitle } from '.'

const FormField = ({
  input,
  label,
  hint,
  required,
  separator,
  width,
}) => {
  // TODO: Currently it will only work with 1 required child
  // const isRequired = React.Children.toArray(children).some(
  //   ({ props: childProps }) => childProps.required
  // )

  return (
    <FieldContainer width={width}>
      <FieldTitle>
        {label && <Text color={theme.textTertiary}>{label}</Text>}
        {required && (
          <Text
            size="xsmall"
            color={theme.accent}
            title="Required"
            style={{ marginLeft: '0.3rem' }}
          >
            *
          </Text>
        )}
        {hint && (
          <div
            style={{
              marginLeft: '0.3rem',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Help hint="">
              {hint}
            </Help>
          </div>
        )}
      </FieldTitle>
      {input}
      {separator && <SidePanelSeparator style={{ marginTop: '1rem' }} />}
    </FieldContainer>
  )
}

const FieldContainer = styled.div`
  width: ${props => props.width};
  margin-bottom: 1rem;
`

FormField.propTypes = {
  input: PropTypes.node,
  label: PropTypes.string,
  required: PropTypes.bool,
  hint: PropTypes.node,
  separator: PropTypes.bool,
  width: PropTypes.string,
}

FormField.defaultProps = {
  width: 'auto',
}

export default FormField
