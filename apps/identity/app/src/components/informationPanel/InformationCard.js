import React, { Fragment, useContext } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Card } from '@aragon/ui'

import { BoxContext } from '../../wrappers/box'
import { editField } from '../../stateManagers/box'
import {
  ReadOrEditTextField,
  ReadOrEditSafeLink,
  ReadOrEditTextArea,
} from '../readOrEditFields'

const InformationCard = ({ ethereumAddress }) => {
  const { boxes, dispatch } = useContext(BoxContext)

  const userLoaded = !!boxes[ethereumAddress]

  const onChange = (value, field) => {
    dispatch(editField(ethereumAddress, field, value))
  }
  const isEditing = userLoaded ? boxes[ethereumAddress].editingProfile : false

  const getValue = field => {
    if (!userLoaded) return ''
    const valueFromPublicProfile =
      boxes[ethereumAddress].publicProfile[field] || ''

    const valueFromForm = boxes[ethereumAddress].forms[field] || ''

    return isEditing ? valueFromForm : valueFromPublicProfile
  }

  return (
    <Fragment>
      <Card width="350px" height="500px">
        <AlignItemsCenter>
          <ReadOrEditTextField
            value={getValue('name')}
            placeholder={'Name'}
            onChange={e => onChange(e.target.value, 'name')}
            type="text"
            editing={isEditing}
            disabled={!userLoaded}
            size="xxlarge"
          />
          <SmallMargin />
          <ReadOrEditTextField
            value={getValue('job')}
            placeholder={'Job'}
            onChange={e => onChange(e.target.value, 'job')}
            type="text"
            editing={isEditing}
            disabled={!userLoaded}
            size="normal"
          />
          <SmallMargin />
          <ReadOrEditTextField
            value={getValue('employer')}
            placeholder={'Employer'}
            onChange={e => onChange(e.target.value, 'employer')}
            type="text"
            editing={isEditing}
            disabled={!userLoaded}
            size="normal"
          />
          <SmallMargin />
          <ReadOrEditTextField
            value={getValue('location')}
            placeholder={'Location'}
            onChange={e => onChange(e.target.value, 'location')}
            type="text"
            editing={isEditing}
            disabled={!userLoaded}
            size="normal"
          />
          <SmallMargin />
          <ReadOrEditSafeLink
            value={getValue('website')}
            placeholder={'Website'}
            onChange={e => onChange(e.target.value, 'website')}
            type="url"
            editing={isEditing}
            disabled={!userLoaded}
            size="normal"
          />
          <SmallMargin />
          <ReadOrEditTextField
            value={getValue('school')}
            placeholder={'Education'}
            onChange={e => onChange(e.target.value, 'school')}
            type="text"
            editing={isEditing}
            disabled={!userLoaded}
            size="normal"
          />
          <SmallMargin />
          <ReadOrEditTextArea
            value={getValue('description')}
            placeholder={'Description'}
            onChange={e => onChange(e.target.value, 'description')}
            type="text"
            editing={isEditing}
            disabled={!userLoaded}
            size="normal"
          />
        </AlignItemsCenter>
      </Card>
    </Fragment>
  )
}

InformationCard.propTypes = {
  ethereumAddress: PropTypes.string.isRequired,
}

const AlignItemsCenter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 50px;
`

const SmallMargin = styled.div`
  margin-top: 10px;
`

export default InformationCard
