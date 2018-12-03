import Aragon, { providers } from '@aragon/client'
import { combineLatest } from './rxjs'

const app = new Aragon()
let appState

app.events().subscribe(handleEvents)

app.state().subscribe(state => {
  console.log('Address Book: entered state subscription:\n', state)
  appState = state ? state : { repos: [] }
  //appState = state
})

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

async function handleEvents(response) {
  let nextState
  switch (response.event) {
  default:
    console.log('iAB: Unknown event catched:', response)
  }
  app.cache('state', nextState)
}

