import { Store } from 'laco'

// Creating a new store with an initial state
export const ToolStore = new Store({ tools: [] })

// Add a tool action
export const addTool = (tool) => ToolStore.set({
  tools: [...ToolStore.get().tools, tool]
})
