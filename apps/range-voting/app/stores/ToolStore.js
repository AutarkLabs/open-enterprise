import { Store } from 'laco'

// Creating a new store with an initial state
export const AllocationStore = new Store({ tools: [] })

// Add a tool action
export const addTool = (tool) => AllocationStore.set({
  tools: [...AllocationStore.get().tools, tool]
})
