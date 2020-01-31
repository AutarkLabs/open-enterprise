import React, { useCallback, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Subject } from 'rxjs'

const updates$ = new Subject()

const IdentityContext = React.createContext({
  resolve: () =>
    Promise.reject(Error('Please set resolve using IdentityProvider')),
})

function useIdentity(address) {
  const [ label, setLabel ] = useState(null)
  const [ source, setSource ] = useState(null)
  //const [ image, setImage ] = useState(null)
  const { resolve, updates$, showLocalIdentityModal } = useContext(
    IdentityContext
  )

  const handleChange = useCallback(metadata => {
    setLabel(metadata ? metadata.name : null)
    setSource(metadata && metadata.source ? metadata.source : null)
  }, [])

  const handleShowLocalIdentityModal = useCallback(
    address => {
      // Emit an event whenever the modal is closed (when the promise resolves)
      return showLocalIdentityModal(address)
        .then(() => updates$.next(address))
        .catch(() => null)
    },
    [ showLocalIdentityModal, updates$ ]
  )

  useEffect(() => {
    resolve(address).then(handleChange)

    const subscription = updates$.subscribe(updatedAddress => {
      if (updatedAddress.toLowerCase() === address.toLowerCase()) {
        // Resolve and update state when the identity have been updated
        resolve(address).then(handleChange)
      }
    })
    return () => subscription.unsubscribe()
  }, [ address, handleChange, updates$ ])

  return [ label, source, handleShowLocalIdentityModal ]
}

const IdentityProvider = ({
  onResolve,
  onShowLocalIdentityModal,
  children,
}) => (
  <IdentityContext.Provider
    value={{
      resolve: onResolve,
      showLocalIdentityModal: onShowLocalIdentityModal,
      updates$,
    }}
  >
    {children}
  </IdentityContext.Provider>
)

IdentityProvider.propTypes = {
  children: PropTypes.node.isRequired,
  onResolve: PropTypes.func.isRequired,
  onShowLocalIdentityModal: PropTypes.func.isRequired,
}

export { IdentityProvider, useIdentity }
