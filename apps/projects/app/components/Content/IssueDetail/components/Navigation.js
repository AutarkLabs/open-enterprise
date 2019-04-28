import React from 'react'
import { AppBar, NavigationBar } from '@aragon/ui'

const Navigation = ({ onClose }) => {
  return (
    <AppBar
      title={
        <NavigationBar items={[ 'Projects', 'Issue Detail' ]} onBack={onClose} />
      }
    />
  )
}

export default Navigation
