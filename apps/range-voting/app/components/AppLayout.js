import styled from 'styled-components'

const AppLayout = styled.div`
  display: flex;
  height: 100vh;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
`

AppLayout.Header = styled.div`
  flex-shrink: 0;
  border-bottom: 1px solid #E6E6E6;
`

AppLayout.ScrollWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  overflow: auto;
  flex-grow: 1;
`

AppLayout.Content = styled.div`
  display: flex;
  flex-direction: column;
  padding: 30px;
  flex-grow: 1;
`

export default AppLayout

