import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { Button, TextInput } from '@aragon/ui'

const onSubmit = save => async e => {
  e.preventDefault()
  const input = e.target.elements.text
  await save(input.value)
  input.value = ''
}

const Input = styled(TextInput.Multiline).attrs({
  wide: true,
})`
  margin-top: 20px;
  margin-bottom: 20px;
  height: 80px;
  padding: 5px 10px;
`

const CommentForm = ({ save }) => {
  return (
    <form onSubmit={onSubmit(save)}>
      <Input name="text" />
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
