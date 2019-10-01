import { handleEvent } from './events'

jest.mock('@aragon/api')

test('RepoAdded', async () => {
  const startingState = {
  }
  const action = {
  }
  const endingState = {
  }
  expect(await handleEvent(startingState, action)).toEqual(endingState)
})
