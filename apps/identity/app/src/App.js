import React from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Main, Button } from '@aragon/ui'
import styled from 'styled-components'

import { Profile } from '../modules/3box-aragon'

function App() {
  const { api, appState, connectedAccount } = useAragonApi()
  const { count, syncing } = appState
  return (
    <Main>
      <BaseLayout>
        {syncing && <Syncing />}
        <Count>Count: {count}</Count>
        <Buttons>
          <Button
            mode="secondary"
            onClick={async () => {
              const profile = new Profile(connectedAccount, api)
              const publicProfile = await profile.getPublic()
              console.log('PUBLIC PROFILE', publicProfile)
              await profile.unlockOrCreate()
              const privateData = await profile.getPrivate()
              console.log('PRIVATE DATA', privateData)
            }}
          >
            Open Box for {connectedAccount}
          </Button>
        </Buttons>
      </BaseLayout>
    </Main>
  )
}

const BaseLayout = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  flex-direction: column;
`

const Count = styled.h1`
  font-size: 30px;
`

const Buttons = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-gap: 40px;
  margin-top: 20px;
`

const Syncing = styled.div.attrs({ children: 'Syncing…' })`
  position: absolute;
  top: 15px;
  right: 20px;
`

export default App
