import React from 'react'

const PanelContext = React.createContext()

export function usePanel() {
  const context = React.useContext(PanelContext)
  if (!context) {
    throw new Error('usePanel must be used within a PanelProvider')
  }
  return context
}

export function PanelProvider(props) {
  const [ panel, setPanelRaw ] = React.useState(null)
  const [ panelOpen, setPanelOpen ] = React.useState(false)

  const setPanel = React.useCallback(args => {
    if (args) {
      setPanelRaw(args)
      setPanelOpen(true)
    } else {
      setPanelOpen(false)
      setTimeout(() => setPanelRaw(args), 500)
    }
  }, [])

  const value = React.useMemo(() => {
    return { panel, panelOpen, setPanel }
  }, [ panel, panelOpen ])

  return <PanelContext.Provider value={value} {...props} />
}

