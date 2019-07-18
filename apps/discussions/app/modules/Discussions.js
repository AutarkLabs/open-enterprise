import React, { useState, useEffect, createContext } from 'react'
import PropTypes from 'prop-types'
// import DiscussionsApi from './DiscussionsApi'

export const DiscussionsContext = createContext({})

const mockDiscussionData = {
  '0': {
    '0': {
      author: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
      createdAt: '1563457930',
      postCid: 'zdpuAmoGJrcd34Wbgvjshs6ZiSqxG7xKtNM21USxcLZRosF9Z',
      revisions: [],
      text: 'Hey chad!',
    },
    '1': {
      author: '0xE8F08D7dc98be694CDa49430CA01595776909Eac',
      createdAt: '1563457970',
      postCid: 'zdpuAmoGJrcd34Wbgvjshs6ZiSqxG7xKtNM21USxcLZRosF9Z',
      revisions: ['zdpuAmoGJrcd34Wbgvjshs6ZiSqxG7xKtNM21USxcLZRosF9Z'],
      text: 'whats up dooooood',
    },
    '2': {
      author: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
      createdAt: '1563458070',
      postCid: 'zdpuAmoGJrcd34Wbgvjshs6ZiSqxG7xKtNM21USxcLZRosF9Z',
      revisions: [],
      text: 'chillin you',
    },
    '3': {
      author: '0xE8F08D7dc98be694CDa49430CA01595776909Eac',
      createdAt: '1563458970',
      postCid: 'zdpuAmoGJrcd34Wbgvjshs6ZiSqxG7xKtNM21USxcLZRosF9Z',
      revisions: [
        'zdpuAmoGJrcd34Wbgvjshs6ZiSqxG7xKtNM21USxcLZRosF9Z',
        'zdpuAmoGJrcdd4Wbgvjshs6ZiSqxG7xKtNM21USxcLZRosF3Z',
      ],
      text:
        'also chillin. This text is going to be arbitrarily long because i love edge cases. And two of us had to do a lot of funny things in life. And im just typing thoughts that come into my head as they come also chillin.This text is going to be arbitrarily long because i love edge cases.And two of us had to do a lot of funny things in life.And im just typing thoughts that come into my head as they come.also chillin.This text is going to be arbitrarily long because i love edge cases.And two of us had to do a lot of funny things in life.And im just typing thoughts that come into my head as they come.also chillin.This text is going to be arbitrarily long because i love edge cases.And two of us had to do a lot of funny things in life.And im just typing thoughts that come into my head as they come.',
    },
    '4': {
      author: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
      createdAt: '1563459000',
      postCid: 'zdpuAmoGJrcd34Wbgvjshs6ZiSqxG7xKtNM21USxcLZRosF9Z',
      revisions: [],
      text: 's',
    },
  },
}

class MockDiscussionApi {
  constructor() {
    this.discussions = mockDiscussionData
  }

  collect = () => this.discussions

  post = (text, discussionThreadId, ethereumAddress) => {
    const discussionPost = {
      author: ethereumAddress,
      createdAt: new Date(),
      revisions: [],
      postCid: 'fake cid goes here',
      text,
    }
    const postIds = Object.keys(this.discussions[discussionThreadId]).sort(
      (a, b) => Number(a) - Number(b)
    )
    const nextKey = Number(postIds[postIds.length - 1]) + 1

    this.discussions[discussionThreadId][nextKey] = discussionPost
    Promise.resolve()
  }

  listenForUpdates = () => {}
}

const Discussions = ({ children, app, ready }) => {
  // const [hasInit, setHasInit] = useState(false)
  const [discussions, setDiscussions] = useState({})
  const [discussionApi, setDiscussionApi] = useState({})

  // useEffect(() => {
  //   const initDiscussions = async () => {
  //     const api = new DiscussionsApi(app)
  //     await api.init()
  //     const discussionData = await api.collect()
  //     setDiscussions(discussionData)
  //     setDiscussionApi(api)
  //     setHasInit(true)
  //
  //     api.listenForUpdates(setDiscussions)
  //   }
  //
  //   if (!hasInit && ready) {
  //     initDiscussions()
  //   }
  // }, [ready])

  useEffect(() => {
    const mockApi = new MockDiscussionApi()
    setDiscussions(mockApi.collect())
    setDiscussionApi(new MockDiscussionApi())
  }, mockDiscussionData)

  return (
    <DiscussionsContext.Provider value={{ discussions, discussionApi }}>
      {children}
    </DiscussionsContext.Provider>
  )
}

Discussions.propTypes = {
  children: PropTypes.node.isRequired,
  app: PropTypes.object,
  ready: PropTypes.bool.isRequired,
}

export default Discussions
