import styled from 'styled-components'
import { theme } from '@aragon/ui'

const Main = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 100px;
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const Subtitle = styled.div`
  margin: auto;
  text-align: left;
  width: 80%;
  color: ${theme.textTertiary};
  margin-bottom: 12px
`

const Title = styled.h1`
  font-size: 37px;
  margin-bottom: 40px;
`

const Hint = styled.div`
  font-size: 11px;
  color: ${theme.textTertiary};
  margin-top: 5px;
  margin-bottom: 5px;
`

export { Main, Content, Subtitle, Title, Hint }
