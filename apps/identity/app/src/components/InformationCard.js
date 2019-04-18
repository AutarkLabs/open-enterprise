import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Card } from '@aragon/ui'

import { BoxContext } from '../wrappers/box'
import { editField } from '../stateManagers/box'
import ReadOrEditTextField from './ReadOrEditTextField'

const InformationCard = ({ ethereumAddress }) => {
  const { boxes, dispatch } = useContext(BoxContext)

  const userLoaded = !!boxes[ethereumAddress]

  const isEditing = (ethereumAddress, boxes) => {
    return userLoaded ? boxes[ethereumAddress].editingProfile : false
  }

  const onChange = (value, field) => {
    dispatch(editField(ethereumAddress, field, value))
  }
  const editing = isEditing(ethereumAddress, boxes)

  const getValue = field => {
    const valueFromPublicProfile = userLoaded
      ? boxes[ethereumAddress].publicProfile[field]
      : ''
    const valueFromForm = userLoaded ? boxes[ethereumAddress].forms[field] : ''

    return editing ? valueFromForm : valueFromPublicProfile
  }

  const preparedFields = userLoaded
    ? Object.keys(boxes[ethereumAddress].forms).filter(
        field => field !== 'image'
      )
    : []

  return (
    <div>
      <Card height="110%">
        {preparedFields.map(field => (
          <div key={field}>
            <br />
            <ReadOrEditTextField
              value={getValue(field)}
              placeholder={field}
              onChange={e => onChange(e.target.value, field)}
              wide
              type="text"
              editing={editing}
              disabled={!userLoaded}
            />
          </div>
        ))}
      </Card>
    </div>
  )
}

InformationCard.propTypes = {
  ethereumAddress: PropTypes.string.isRequired,
}

export default InformationCard
