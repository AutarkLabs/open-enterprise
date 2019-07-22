import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { Button, Field, TextInput, Text, theme } from '@aragon/ui'
import { IconMarkdown } from '../../../../shared/ui'

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

const Hint = styled(Text.Block).attrs({
  color: theme.textTertiary,
  size: 'xsmall',
})`
  display: flex;
  justify-content: space-between;
`

const CommentForm = ({ save }) => {
  return (
    <form onSubmit={onSubmit(save)}>
      <Field label="Your Comment">
        <Input name="text" />
        <Hint>
          <Text monospace>
            *bold* &nbsp;&nbsp; _italics_ &nbsp;&nbsp; ### heading &nbsp;&nbsp;
            &gt; quote
          </Text>
          <a
            target="_blank"
            href="https://guides.github.com/features/mastering-markdown/"
          >
            <IconMarkdown />
          </a>
        </Hint>
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
