import React, { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { ASSETS_URL, EmptyStateCard, Header, Main } from '@aragon/ui'
import Decisions from './Decisions'
import { useAragonApi } from '@aragon/api-react'
import { IdentityProvider } from '../../../shared/identity'
import emptyStatePng from './assets/voting-empty-state.png'

const illustration = <img src={emptyStatePng} alt="" height="160" />

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

const Wrap = ({ children }) => (
  <Main assetsUrl={ASSETS_URL}>
    <Header primary="Dot Voting" />
    {children}
  </Main>
)

Wrap.propTypes = {
  children: PropTypes.node.isRequired,
}

const App = () => {
  useVoteCloseWatcher()

  const { api, appState = {}, connectedAccount } = useAragonApi()

  const handleResolveLocalIdentity = useCallback(address => {
    return api.resolveAddressIdentity(address).toPromise()
  }, [api])

  const handleShowLocalIdentityModal = useCallback(address => {
    return api
      .requestAddressIdentityModification(address)
      .toPromise()
  }, [api])

  const {
    votes = [],
    entries = [],
    tokenAddress = '',
    voteTime = 0,
    minParticipationPct = 0,
    pctBase = 0,
  } = appState

  if (!votes.length) return (
    <Wrap>
      <div
        css={`
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: -1;
        `}
      >
        <EmptyStateCard
          title="You do not have any dot votes."
          text="Use the Allocations app to get started."
          onActivate={() => <div />}
          illustration={illustration}
        />
      </div>
    </Wrap>
  )

  return (
    <Wrap>
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
    </Wrap>
  )
}

// eslint-disable-next-line react/display-name
export default App
