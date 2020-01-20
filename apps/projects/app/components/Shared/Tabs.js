import React from 'react'
import usePathHelpers from '../../../../../shared/utils/usePathHelpers'
import { Tabs as AragonTabs } from '@aragon/ui'
import { useAragonApi } from '../../api-react'

export default function Tabs() {
  const { parsePath, requestPath } = usePathHelpers()
  const { appState: { repos } } = useAragonApi()

  const tabs = ['General']
  if (repos.length) tabs.push('Issues')
  tabs.push('Settings')

  const { tab } = parsePath('^/:tab')

  return (
    <AragonTabs
      items={tabs}
      onChange={index => {
        if (index === 0) requestPath('/')
        else requestPath('/' + tabs[index].toLowerCase())
      }}
      selected={!tab ? 0 : tabs.findIndex(t => t.toLowerCase() === tab)}
    />
  )
}
