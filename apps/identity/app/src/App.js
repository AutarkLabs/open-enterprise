import React from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Main } from '@aragon/ui'
import styled from 'styled-components'

import { BoxWrapper } from './wrappers/box'
import AppContainer from './wrappers/styleWrappers/AppContainer'
import LoadAndErrorWrapper from './wrappers/loadAndErrorWrapper'
import Profile from './components/Profile'

function App() {
  const { connectedAccount } = useAragonApi()
  return (
    <Main>
      <BoxWrapper>
        <AppContainer>
          <BaseLayout>
            <LoadAndErrorWrapper ethereumAddress={connectedAccount}>
              <Profile ethereumAddress={connectedAccount} />
            </LoadAndErrorWrapper>
          </BaseLayout>
        </AppContainer>
      </BoxWrapper>
    </Main>
  )
}

const BaseLayout = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
`

export default App
