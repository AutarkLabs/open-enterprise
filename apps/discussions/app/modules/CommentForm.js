import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { Button, Field, TextInput, Text, theme } from '@aragon/ui'
import { IconMarkdown } from '../../../../shared/ui'

// aragon wrapper currently places a question mark "help" icon at the bottom
// right of the page, which overlaps the form submit buttons, given its current
// location in the sidebar. If either of these factors change later, we may be
// able to remove this spacer.
const QUESTION_MARK_SPACER = '40px'

const Buttons = styled.div`
  display: grid;
  grid-gap: 10px;
  grid-template-columns: 1fr 1fr;
  margin: 0 0 40px auto;
  margin-bottom: ${QUESTION_MARK_SPACER};
  max-width: 300px;
`

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

const CommentForm = ({ defaultValue, onCancel, onSave }) => {
  const [text, setText] = React.useState(defaultValue || '')

  // TODO: confirm prior to clearing
  const clear = () => {
    if (defaultValue) setText(defaultValue)
    else setText('')

    if (onCancel) onCancel()
  }

  const submit = async e => {
    e.preventDefault()
    await onSave({ text })
    clear()
  }

  return (
    <form onSubmit={submit}>
      <Field label="Your Comment">
        <Input
          autoFocus={!!defaultValue}
          onChange={e => setText(e.target.value)}
          name="text"
          value={text}
        />
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
      <Buttons>
        <Button
          css={`
            border: 1px solid ${theme.contentBorder};
            font-weight: bold;
          `}
          onClick={clear}
        >
          Cancel
        </Button>
        <Button
          disabled={!text || text === defaultValue}
          mode="strong"
          type="submit"
        >
          {defaultValue ? 'Save' : 'Post'}
        </Button>
      </Buttons>
    </form>
  )
}

CommentForm.propTypes = {
  defaultValue: PropTypes.string,
  onCancel: PropTypes.func,
  onSave: PropTypes.func.isRequired,
}

export default CommentForm
