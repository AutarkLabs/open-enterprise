import React from 'react'

// TODO: needs to be environment-aware

export const e2eTag = (value, tag, tagValue) => {
  const prop = { ['data-e2e-'+tag]: tagValue }
  return <span {...prop}>{value}</span>
}
