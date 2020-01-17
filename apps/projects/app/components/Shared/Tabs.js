import React from 'react'
import usePathSegments from '../../hooks/usePathSegments'
import { Tabs as AragonTabs } from '@aragon/ui'
import { useAragonApi, usePath } from '../../api-react'

export default function Tabs() {
  const { selectedTab } = usePathSegments()
  const { appState: { repos } } = useAragonApi()
  const [ , requestPath ] = usePath()

  const tabs = ['General']
  if (repos.length) tabs.push('Issues')
  tabs.push('Settings')

  return (
    <AragonTabs
      items={tabs}
      onChange={index => {
        if (index === 0) requestPath('/')
        else requestPath('/' + tabs[index].toLowerCase())
      }}
      selected={tabs.findIndex(t => t.toLowerCase() === selectedTab)}
    />
  )
}
