import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { Button, Field, TextInput } from '@aragon/ui'

const onSubmit = save => async e => {
  e.preventDefault()
  const input = e.target.elements.text
  await save(input.value)
  input.value = ''
}

const Input = styled(TextInput.Multiline).attrs({
  wide: true,
})`
  margin-top: 15px;
  height: 80px;
  padding: 10px;
`

const CommentForm = ({ save }) => {
  return (
    <form onSubmit={onSubmit(save)}>
      <Field label="Your Comment">
        <Input name="text" />
      </Field>
      <Button mode="strong" wide type="submit">
        Post Comment
      </Button>
    </form>
  )
}

CommentForm.propTypes = {
  save: PropTypes.func.isRequired,
}

export default CommentForm
