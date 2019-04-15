import React from 'react'
import { createPortal } from 'react-dom'
import { theme } from '@aragon/ui'

import { Detail, Navigation } from './components'

const modalRoot = document.querySelector('#projects')

const issueDetailStyle = {
  position: 'absolute',
  top: '0',
  height: '100vh',
  zIndex: '2',
  width: '100vw',
  overflowX: 'hidden',
  background: theme.mainBackground,
}

// TODO: Much better to pass only a issueId and populate and cache data from the component, but current code is only for UI layout
export default class IssueDetail extends React.Component {
  el = document.createElement('div')

  componentDidMount() {
    modalRoot.appendChild(this.el)
  }
  componentWillUnmount() {
    modalRoot.removeChild(this.el)
  }

  render() {
    const { onClose, issue, onReviewApplication, onRequestAssignment, onSubmitWork, onAllocateSingleBounty, onReviewWork, onUpdateBounty } = this.props

    return createPortal(
      <div style={issueDetailStyle}>
        <Navigation onClose={onClose} />
        <Detail 
          {...issue}
          onReviewApplication={onReviewApplication}
          onRequestAssignment={onRequestAssignment}
          onSubmitWork={onSubmitWork}
          onAllocateSingleBounty={onAllocateSingleBounty}
          onReviewWork={onReviewWork}
          onUpdateBounty={onUpdateBounty}
        />
      </div>,
      this.el
    )
  }
}
