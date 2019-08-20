import React, { useEffect, useState } from 'react'
import { ASSETS_URL, Header, Main } from '@aragon/ui'
import Decisions from './Decisions'
import { useAragonApi } from '@aragon/api-react'
import { IdentityProvider } from '../../../shared/identity'

const useVoteCloseWatcher = () => {
  const { votes = [], voteTime = 0 } = useAragonApi().appState
  const [ now, setNow ] = useState(new Date().getTime())

  useEffect(() => {
    const timeouts = {}

    votes.forEach(({ voteId: id, data: { startDate } }) => {
      const endTime = new Date(startDate + voteTime).getTime()

      if (endTime < now) return // ignore; voting has closed

      timeouts[id] = setTimeout(
        () => setNow(new Date().getTime()),
        endTime - now
      )
    })

    return function cleanup() {
      for (let id in timeouts) {
        clearTimeout(timeouts[id])
      }
    }
  }, [ votes, voteTime ])
}

const App = () => {
  useVoteCloseWatcher()

  const { api, appState = {}, connectedAccount } = useAragonApi()

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
