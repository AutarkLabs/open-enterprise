import React from "react"
import styled from "styled-components"

export const Hidden = styled.div`
  position: absolute;
  left: -9000em;
  top: -9000em;
`

export const ShowOnFocus = styled(Hidden)`
  &:focus-within {
    position: initial;
  }
`

// hide an element for sighted users,
// but leave it available for screen readers,
// and accessible to keyboard nav
//
// input: a wrapper styled-component to trigger hover styles
// output: a styled component
export const showOnHover = wrap =>
  styled(ShowOnFocus)`
    ${wrap}:hover & {
      position: initial;
    }
  `
