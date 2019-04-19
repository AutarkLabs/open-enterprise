import React from 'react'
import styled from 'styled-components'
import { Card, Text } from '@aragon/ui'

const RightPanel = () => {
  return (
    <Spacing>
      <Card width="700px" height="200px">
        <TitleSpace />
        <Title size="xlarge">Organizations</Title>
        <br />
        <Center>
          <Text color="grey">Coming Soon</Text>
        </Center>
      </Card>
    </Spacing>
  )
}

export default RightPanel

const Spacing = styled.div`
  margin-top: 170px;
  padding-right: 90px;
`

const Title = styled(Text)`
  margin-left: 20px;
`

const TitleSpace = styled.div`
  height: 10px;
`

const Center = styled.div`
  display: flex;
  justify-content: center;
  line-height: 7;
`
