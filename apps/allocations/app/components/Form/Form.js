import PropTypes from 'prop-types'
import React from 'react'
import { Button, Text, theme } from '@aragon/ui'

const Form = ({
  children,
  onSubmit,
  submitText,
  heading,
  subHeading,
  disabled
}) => {
  return (
    // TODO: Fix the SidePanel 2 lines heading thing
    <React.Fragment>
      {heading && <Text size="xxlarge">{heading}</Text>}
      {subHeading && <Text size="large" color={theme.textSecondary}>{subHeading}</Text>}
      <div style={{ height: '10px' }} />
      {children}
      <Button
        style={{ userSelect: 'none' }}
        mode="strong"
        wide
        onClick={onSubmit}
        disabled={disabled}
      >
        {submitText}
      </Button>
    </React.Fragment>
  )
}

Form.propTypes = {
  children: PropTypes.node.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitText: PropTypes.string.isRequired,
  heading: PropTypes.string,
  subHeading: PropTypes.string,
  disabled: PropTypes.bool,
}

Form.defaultProps = {
  submitText: 'Submit',
  disabled: false,
}

export default Form
