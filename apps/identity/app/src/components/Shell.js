import React, { useContext } from 'react'

import { BoxContext } from '../boxHelpers'
import { log } from '../../utils'

const Shell = props => {
  const { boxState, dispatch } = useContext(BoxContext)
  log(boxState, dispatch)
  return <div>We are using context!</div>
}

export default Shell
