import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
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
      ? boxes[ethereumAddress].publicProfile[field] || ''
      : ''
    const valueFromForm = userLoaded ? boxes[ethereumAddress].forms[field] : ''

    return editing ? valueFromForm : valueFromPublicProfile
  }

  return (
    <div>
      <Card width="350px" height="500px">
        <AlignItemsCenter>
          <ReadOrEditTextField
            value={getValue('name')}
            placeholder={'Name'}
            onChange={e => onChange(e.target.value, 'name')}
            type="text"
            editing={editing}
            disabled={!userLoaded}
            size="xxlarge"
          />
          <SmallMargin />
          <ReadOrEditTextField
            value={getValue('job')}
            placeholder={'Job'}
            onChange={e => onChange(e.target.value, 'job')}
            type="text"
            editing={editing}
            disabled={!userLoaded}
            size="normal"
          />
          <SmallMargin />
          <ReadOrEditTextField
            value={getValue('location')}
            placeholder={'Location'}
            onChange={e => onChange(e.target.value, 'location')}
            type="text"
            editing={editing}
            disabled={!userLoaded}
            size="normal"
          />
        </AlignItemsCenter>
      </Card>
    </div>
  )
}

InformationCard.propTypes = {
  ethereumAddress: PropTypes.string.isRequired,
}

export default InformationCard

const AlignItemsCenter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 50px;
`

const SmallMargin = styled.div`
  margin-top: 10px;
`
