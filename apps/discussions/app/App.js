import React, { useState } from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Main, Button, TextInput } from '@aragon/ui'
import styled from 'styled-components'

import { ipfs } from './ipfs'

function App() {
  const { api, appState, connectedAccount } = useAragonApi()
  const { syncing } = appState

  const [text, setText] = useState('')
  const [id, setId] = useState(-1)

  const post = async () => {
    const discussionPost = {
      author: connectedAccount,
      mentions: [],
      type: 'Post',
      text,
    }

    try {
      const result = await ipfs.dag.put(discussionPost, {})
      const cid = result.toBaseEncodedString()
      await api.post(cid, '123').toPromise()
      setText('')
    } catch (error) {
      console.error(error)
    }
  }

  const revise = async () => {
    let discussionPost = appState.discussions['123'][id]
    discussionPost.text = text
    discussionPost.revisions.push(discussionPost.postCid)
    delete discussionPost.postCid
    try {
      const result = await ipfs.dag.put(discussionPost, {})
      const cid = result.toBaseEncodedString()
      await api.revise(cid, id, '123').toPromise()
      setText('')
      setId(-1)
    } catch (error) {
      console.error(error)
    }
  }

  const hide = async () => {
    try {
      await api.hide(id, '123').toPromise()
      setId(-1)
    } catch (error) {
      console.error(error)
    }
  }

  console.log(appState)
  return (
    <Main>
      <BaseLayout>
        {syncing && <Syncing />}
        <TextInput
          placeholder="write a discussion"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        Enter post Id to hide or revise post
        <TextInput.Number
          placeholder="enter post ID to hide"
          value={id}
          onChange={e => setId(Number(e.target.value))}
        />
        <Buttons>
          <Button mode="secondary" onClick={post}>
            Make post
          </Button>
          <Button mode="secondary" onClick={revise}>
            Revise post
          </Button>
          <Button mode="secondary" onClick={hide}>
            Hide post
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
