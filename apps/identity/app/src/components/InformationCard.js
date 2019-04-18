import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Card } from '@aragon/ui'

import { BoxContext } from '../wrappers/box'

const InformationCard = () => {
  const { boxes, dispatch } = useContext(BoxContext)

  return (
    <div>
      <Card>Yo</Card>
    </div>
  )
}

InformationCard.propTypes = {}

export default InformationCard
