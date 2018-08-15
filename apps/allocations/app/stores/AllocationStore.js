import { Store } from 'laco'

// Creating a new store with an initial state
export const AllocationStore = new Store({ allocations: [] })

// Add a allocation action
export const addAllocation = (allocation) => AllocationStore.set({
  allocations: [...AllocationStore.get().allocations, allocation]
})
