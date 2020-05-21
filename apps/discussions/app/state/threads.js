import { ipfsGet } from '../ipfs'

export const newThread = async (state, { thread, metadata }) => {
  const { threads = [] } = state
  const {
    name,
    title,
    description,
    creationDate,
    context,
    author,
  } = await ipfsGet(metadata)
  threads.push({
    address: thread,
    name,
    title,
    description,
    context,
    creationDate: new Date(creationDate),
    author,
  })
  return threads
}

export const editThread = async (state, { thread, metadata }) => {
  const { threads = [] } = state
  const { description } = await ipfsGet(metadata)
  const index = threads.findIndex(t => t.address === thread)
  if (index > -1) threads[index].description = description
  return threads
}

export const updateThread = async (state, { thread, metadata }) => {
  const { threads = [] } = state
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
  return threads
}

export const deleteThread = async (state, { thread }) => {
  const { threads = [] } = state
  return threads.filter(t => t.address !== thread)
}
