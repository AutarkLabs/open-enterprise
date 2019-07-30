import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { Button, Field, TextInput, Text, theme } from '@aragon/ui'
import { IconMarkdown } from '../../../../shared/ui'

const Buttons = styled.div`
  display: grid;
  grid-gap: 10px;
  grid-template-columns: ${props => (props.cancelling ? '1fr' : '1fr 1fr')};
  margin-left: auto;
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
  const [cancelInProgress, setCancelInProgress] = React.useState(false)
  const startCancel = () => setCancelInProgress(true)
  const abortCancel = () => setCancelInProgress(false)

  const clear = () => {
    setCancelInProgress(false)

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
      <Buttons cancelling={cancelInProgress}>
        <Button
          css={`
            ${cancelInProgress
              ? ''
              : `border: 1px solid ${theme.contentBorder};`}
            font-weight: bold;
          `}
          disabled={!text && !onCancel}
          mode={cancelInProgress && 'strong'}
          emphasis={cancelInProgress && 'negative'}
          onBlur={abortCancel}
          onClick={cancelInProgress ? clear : startCancel}
        >
          {cancelInProgress ? 'Confirm Cancel' : 'Cancel'}
        </Button>
        {!cancelInProgress && (
          <Button
            disabled={!text || text === defaultValue}
            mode="strong"
            type="submit"
          >
            {defaultValue ? 'Save' : 'Post'}
          </Button>
        )}
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
