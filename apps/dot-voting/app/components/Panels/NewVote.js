import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useAragonApi } from '../../api-react'
import {
  Field,
  IconClose,
  TextInput,
  useSidePanel,
  useTheme,
} from '@aragon/ui'
import { Form, OptionsInput } from '../../../../../shared/ui'
import { encodeInformationVote } from '../../utils/vote-utils'

const ErrorMessage = ({ children }) => {
  const theme = useTheme()
  return (
    <div css={`
      font-size: small;
      display: flex;
      align-items: center;
    `}>
      <IconClose
        size="tiny"
        css={`
          margin-right: 8px;
          color: ${theme.negative};
        `}
      />
      {children}
    </div>
  )
}

ErrorMessage.propTypes = {
  children: PropTypes.node,
}

const NewVote = ({ onClose }) => {
  const { readyToFocus } = useSidePanel()
  const { api } = useAragonApi()
  const [ description, setDescription ] = useState()
  const [ options, setOptions ] = useState({ '0':'' })
  const [ optionsId, setOptionsId ] = useState(0)
  const [ submitDisabled, setSubmitDisabled ] = useState(true)
  const [ errors, setErrors ] = useState(null)

  useEffect(() => {
    if(!description) return setSubmitDisabled(true)
    if(Object.values(options).some(v => !v)) return setSubmitDisabled(true)
    if(Object.values(options).length !== new Set(Object.values(options)).size){
      setErrors(<ErrorMessage>The same option cannot be specified twice.</ErrorMessage>)
      return setSubmitDisabled(true)
    }
    setErrors(null)
    return setSubmitDisabled(false)
  }, [ description, options ])

  const updateOptions = e => {
    if(e.target.name === 'optionsAdd'){
      const newOptions = { ...options }
      const newId = optionsId + 1
      newOptions[newId] = ''
      setOptionsId(newId)
      setOptions(newOptions)
    }
    if(e.target.name === 'optionsChange'){
      const newOptions = { ...options }
      newOptions[e.target.id] = e.target.value
      setOptions(newOptions)
    }
    if(e.target.name === 'optionsRemove'){
      const newOptions = { ...options }
      delete newOptions[e.target.id]
      setOptions(newOptions)
    }
  }

  const createVote = async () => {
    const currentApp = await api.currentApp().toPromise()
    const callscript = encodeInformationVote(
      currentApp.appAddress,
      description,
      Object.values(options).filter(o => o !== '')
    )
    api.newVote(callscript, description).toPromise()
    onClose()
  }

  return (
    <Form
      disabled={submitDisabled}
      onSubmit={createVote}
      submitText="Submit"
      errors={errors}
    >
      <Field
        required
        label="Description"
      >
        <TextInput.Multiline
          name="description"
          value={description}
          rows="3"
          onChange={e => setDescription(e.target.value)}
          placeholder="Add your description here."
          wide
          autofocus={readyToFocus}
        />
      </Field>
      <Field
        label="Options"
        required
      >
        <OptionsInput
          options={options}
          onChange={updateOptions}
        />
      </Field>
    </Form>
  )
}

NewVote.propTypes = {
  onClose: PropTypes.func.isRequired,
}

export default NewVote
