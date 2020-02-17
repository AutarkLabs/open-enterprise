import { useState } from 'react'

export default function useReviewFilters(data, requestedItem, canReview) {
  const unreviewed = canReview ? 'Available for review' : 'Unreviewed'

  // initially there are two arrays for reviewed and unreviewed requests
  const items = [[], []]
  const filterNames = [ 'Reviewed', unreviewed ]

  // split requests
  data.forEach(request =>
    items['review' in request ? 0 : 1].push(request)
  )

  // remove empty
  Array(1, 0).forEach(i => {
    if (items[i].length === 0) {
      items.splice(i,1)
      filterNames.splice(i,1)
    }
  })

  let initialFilter = 0
  let initialItem = 0

  items.forEach((a, filterIndex) => {
    let itemIndex
    if ((itemIndex = a.findIndex(request =>
      request === requestedItem
    )) !== -1) {
      initialFilter = filterIndex
      initialItem = itemIndex
    }
  })

  const [ selectedFilter, setSelectedFilter ] = useState(initialFilter)
  const [ selectedItem, setSelectedItem ] = useState(initialItem)

  return {
    items,
    filterNames,
    selectedFilter,
    setSelectedFilter,
    selectedItem,
    setSelectedItem,
  }
}

