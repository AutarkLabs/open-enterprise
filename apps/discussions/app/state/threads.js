import { ipfsGet } from '../ipfs'

export const updateThread = async (state, { thread, metadata }) => {
  const { threads = [] } = state
  try {
    const {
      name,
      title,
      description,
      creationDate,
      context,
      author,
    } = await ipfsGet(metadata)
    const index = threads.findIndex(t => t.address === thread)
    if (index > -1) threads[index].description = description
    else {
      threads.push({
        address: thread,
        name,
        title,
        description,
        context,
        creationDate: new Date(creationDate),
        author,
      })
    }
    return {
      ...state,
      threads
    }
  } catch (e) {
    console.error(e)
    return state
  }
}

export const deleteThread = async (state, { thread }) => {
  const { threads = [] } = state
  const filteredThreads = threads.filter(t => t.address !== thread)
  return {
    ...state,
    threads: filteredThreads
  }
}
