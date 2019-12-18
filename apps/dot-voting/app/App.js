import React, { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Button, EmptyStateCard, GU, Header, IconPlus, LoadingRing, Main, SidePanel, SyncIndicator } from '@aragon/ui'
import { useAragonApi } from './api-react'
import { IdentityProvider } from './components/LocalIdentityBadge/IdentityManager'
import { AppLogicProvider, useAppLogic } from './app-logic'
import { NewVote } from './components/Panels'
import Decisions from './Decisions'
import emptyStatePng from './assets/voting-empty-state.png'

const ASSETS_URL = './aragon-ui'

const illustration = <img src={emptyStatePng} alt="" height="160" />

const useVoteCloseWatcher = () => {
  const { votes, voteTime } = useAppLogic()
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

const Empty = ({ isSyncing, onClick }) => (
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
      text={
        isSyncing ? (
          <div
            css={`
              display: grid;
              align-items: center;
              justify-content: center;
              grid-template-columns: auto auto;
              grid-gap: ${1 * GU}px;
            `}
          >
            <LoadingRing />
            <span>Syncing…</span>
          </div>
        ) : (
          'No dot votes here'
        )}
      action={<Button label="New dot vote" onClick={onClick} />}
      illustration={illustration}
    />
  </div>
)

Empty.propTypes = {
  isSyncing: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
}

const App = () => {
  useVoteCloseWatcher()

  const { api } = useAragonApi()
  const [ panelOpen, setPanelOpen ] = useState(false)
  const newVote = () => setPanelOpen(true)
  const closePanel = () => setPanelOpen(false)

  const handleResolveLocalIdentity = useCallback(address => {
    return api.resolveAddressIdentity(address).toPromise()
  }, [api])

  const handleShowLocalIdentityModal = useCallback(address => {
    return api
      .requestAddressIdentityModification(address)
      .toPromise()
  }, [api])

  const { isSyncing, votes } = useAppLogic()

  return (
    <IdentityProvider
      onResolve={handleResolveLocalIdentity}
      onShowLocalIdentityModal={handleShowLocalIdentityModal}>
      {!votes.length ? (
        <Empty isSyncing={isSyncing} onClick={newVote} />
      ) : (
        <>
          <Header
            primary="Dot Voting"
            secondary={
              <Button
                mode="strong"
                icon={<IconPlus />}
                onClick={newVote}
                label="New dot vote"
              />
            } />
          <Decisions/>
          <SyncIndicator visible={isSyncing} />
        </>
      )}
      <SidePanel title='New dot vote' opened={panelOpen} onClose={closePanel}>
        <NewVote onClose={closePanel} />
      </SidePanel>
    </IdentityProvider>
  )
}

const DotVoting = () =>
  <main>
    <Main assetsUrl={ASSETS_URL}>
      <AppLogicProvider>
        <App />
      </AppLogicProvider>
    </Main>
  </main>

// eslint-disable-next-line react/display-name
export default DotVoting
