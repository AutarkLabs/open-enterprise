// import React from 'react'
// import styled from 'styled-components'
// import { Button, SidePanel } from '@aragon/ui'

// import { EmptyContent } from './'
// import { NewProject } from '../Panel'

// /*
// 	- Content
// 	- SidePanel
// 	- ActionButton
//     - EmptyStateCard
// */

// const StyledButton = styled(Button)`
//   position: absolute;
//   top: -53.5px;
//   right: 30px;
//   z-index: 2;
// `

// // TODO: this.props.children || empty-content
// class ContentLayout extends React.Component {
//   state = { sidePanelOpened: false }

//   closeSidePanel = () => {
//     this.setState({ sidePanelOpened: false })
//   }

//   openSidePanel = () => {
//     this.setState({ sidePanelOpened: true })
//   }

//   render() {
//     return (
//       <React.Fragment>
//         <div>Feeo</div>
//         {/* {this.props.isEmpty ? (
//           <EmptyContent
//             emptyState={{
//               action: this.openSidePanel,
//               ...this.props.emptyState,
//             }}
//           />
//         ) : (
//           this.props.children
//         )} */}
//         {/* <StyledButton mode="strong" onClick={this.openSidePanel}>
//           New Project
//         </StyledButton> */}
//         {/* <SidePanel
//           title="New Project"
//           opened={this.state.sidePanelOpened}
//           onClose={this.closeSidePanel}
//         > */}
//         {/* <NewProject
//             // github={github}
//             // onHandleAddRepos={onHandleAddRepos}
//             // onHandleGitHubAuth={onHandleGitHubAuth}
//             // closeSidePanel={this.closeSidePanel}
//           /> */}
//         {/* </SidePanel> */}
//       </React.Fragment>
//     )
//   }
// }

// export default ContentLayout
