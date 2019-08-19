import React, { useState } from 'react'
import { ASSETS_URL, Header, Main } from '@aragon/ui'
import Decisions from './Decisions'
import { useAragonApi } from '@aragon/api-react'
import { IdentityProvider } from '../../../shared/identity'

const App = () => {
  const { api, appState = {}, connectedAccount } = useAragonApi()
  const [ now, setNow ] = useState(new Date().getTime())

  const {
    votes = [],
    entries = [],
    tokenAddress = '',
    voteTime = 0,
    minParticipationPct = 0,
    pctBase = 0,
  } = appState

  const handleResolveLocalIdentity = address => {
    return api.resolveAddressIdentity(address).toPromise()
  }

  const handleShowLocalIdentityModal = address => {
    return api
      .requestAddressIdentityModification(address)
      .toPromise()
  }

  if (votes.length) {
    let reloadTime = 0
    {votes.map(vote => {
      const voteEndTS = new Date(vote.data.startDate + voteTime).getTime()
      const timeToEnd = voteEndTS - now
      if (timeToEnd > 0 && (reloadTime === 0 || timeToEnd < reloadTime)) reloadTime = timeToEnd
    })}
    if (reloadTime) {
      setInterval( () => setNow(new Date()), reloadTime + 5000)
    }
  }

  return (
    <Main assetsUrl={ASSETS_URL}>
      <Header
        primary="Dot Voting"
      />
      <IdentityProvider
        onResolve={handleResolveLocalIdentity}
        onShowLocalIdentityModal={handleShowLocalIdentityModal}>

        <Decisions
          app={api}
          votes={votes}
          entries={entries}
          voteTime={voteTime}
          minParticipationPct={minParticipationPct / 10 ** 16}
          pctBase={pctBase / 10 ** 16}
          tokenAddress={tokenAddress}
          userAccount={connectedAccount}
        />
      </IdentityProvider>
    </Main>
  )
}

// eslint-disable-next-line react/display-name
export default App
