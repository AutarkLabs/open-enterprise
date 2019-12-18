import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Button } from '@aragon/ui'

const Form = ({
  children,
  className,
  onSubmit,
  submitText,
  disabled,
  errors,
}) => {
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <VerticalSpace />
      {children}
      <Button
        type="submit"
        style={{ marginTop: '24px' }}
        mode="strong"
        wide
        disabled={disabled}
      >
        {submitText}
      </Button>
      <ErrorBlock>
        {errors}
      </ErrorBlock>
    </form>
  )
}

const ErrorBlock = styled.div`
  margin-top: 24px;
`

const VerticalSpace = styled.div`
  height: 24px;
`

Form.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  submitText: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  errors: PropTypes.node,
}

Form.defaultProps = {
  submitText: 'Submit',
  disabled: false,
}

export default Form
