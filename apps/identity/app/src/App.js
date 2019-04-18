import React from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Main } from '@aragon/ui'
import styled from 'styled-components'

import { BoxWrapper } from './wrappers/boxHelpers'
import LoadAndErrorWrapper from './wrappers/loadAndErrorWrapper'

function App() {
  const { api, connectedAccount } = useAragonApi()
  return (
    <Main>
      <BaseLayout>
        <BoxWrapper api={api} connectedAccount={connectedAccount}>
          <LoadAndErrorWrapper ethereumAddress={connectedAccount}>
            <div>yo</div>
          </LoadAndErrorWrapper>
        </BoxWrapper>
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

export default App
