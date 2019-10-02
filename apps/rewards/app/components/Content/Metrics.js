import React from 'react'
import { Card, useTheme } from '@aragon/ui'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const Metrics = ({ content }) => {
  const theme = useTheme()
  return (
    <Card
      width="100%"
      height="147px"
      css={{
        justifyContent: 'flex-start'
      }}
    >
      <Title theme={theme}>metrics</Title>
      <Content>
        {content.map(({ name, value, unit }, i) => (
          <Metric key={i} name={name} value={value} unit={unit} />
        ))}
      </Content>
    </Card>
  )
}

const Title = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  align-self: flex-start;
  width: 100%;
  height: 34px;
  font-variant: small-caps;
  color: ${({ theme }) => theme.contentSecondary};
  padding: 8px 24px;
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 600;
`
const Content = styled.div`
  width: 100%;
  flex-grow: 1;
  display: flex;
  padding: 24px;
  justify-content: space-evenly;
`

Metrics.propTypes = {
  content: PropTypes.arrayOf(PropTypes.object).isRequired,
}

const Metric = ({ name, value, unit }) => {
  const theme = useTheme()
  return (
    <Container>
      <Name theme={theme}>{name}</Name>
      <Amount>
        <Value
          theme={theme}
          positive={value.startsWith('+')}
        >
          {value}
        </Value>
        {' '}
        <Unit
          theme={theme}
          positive={value.startsWith('+')}
        >
          {unit}
        </Unit>
      </Amount>
    </Container>
  )
}

const Container = styled.div` `
const Name = styled.div`
  color: ${({ theme }) => theme.contentSecondary};
  font-size: 16px;
  font-weight: 300;
`
const Amount = styled.div`
  color: ${({ theme }) => theme.content};
  font-weight: 300;
`

const Value = styled.span`
  font-size: 26px;
  color: ${({ theme, positive }) => positive ? theme.positive : 'inherit'};
`
const Unit = styled.span`
  font-size: 18px;
  color: ${({ theme, positive }) => positive ? theme.positive : 'inherit'};
`

Metric.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  unit: PropTypes.string.isRequired,
}

export default Metrics
