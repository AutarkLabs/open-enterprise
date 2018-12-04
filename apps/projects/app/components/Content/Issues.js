import React from 'react'
// import { Query } from 'react-apollo'
// import gql from 'graphql-tag'
// import styled from 'styled-components'
// import {
//   Button,
//   Dropdown,
//   Text,
//   TextInput,
//   theme,
//   ContextMenuItem,
//   IconShare,
//   IconAdd,
// } from '@aragon/ui'

// import { ActionsMenu, FilterBar } from '../Shared'
// import Issue from '../Card'

// import ethereumLoadingAnimation from '../Shared/assets/svg/ethereum-loading.svg'

// // TODO: Shared component
// const ActionLabel = styled.span`
//   margin-left: 15px;
// `

class Issues extends React.PureComponent {
  // state = {
  //   selectedIssues: [],
  // }
  // handleCurateIssues = () => {
  //   console.log('let\'s curate this issues:', this.state.selectedIssues)
  // }

  // handleAllocateBounties = () => {
  //   console.log('handleAllocateBounties')
  // }

  // handleIssueSelection = id => {
  //   this.setState(({ selectedIssues }) => {
  //     const newSelectedIssues = selectedIssues.includes(id)
  //       ? selectedIssues.filter(issue => issue !== id)
  //       : [...new Set([].concat(...selectedIssues, id))]
  //     return { selectedIssues: newSelectedIssues }
  //   })
  // }

  render() {
    return <div>Hola</div>
    // return (
    //   <StyledIssues>
    //     <StyledSearchBar>
    //       <StyledSearchInput>
    //         <StyledTextInput />
    //         <Magnifier />
    //       </StyledSearchInput>
    //       {/* // TODO: Here it goes the active filters box */}
    //       <ActionsMenu
    //         mode="secondary"
    //         enabled={!!this.state.selectedIssues.length}
    //       >
    //         <ContextMenuItem
    //           onClick={this.handleCurateIssues}
    //           style={{ display: 'flex', alignItems: 'flex-start' }}
    //         >
    //           <div>
    //             <IconAdd color={theme.textTertiary} />
    //           </div>
    //           <ActionLabel>Curate Issues</ActionLabel>
    //         </ContextMenuItem>
    //         <ContextMenuItem
    //           onClick={this.handleAllocateBounties}
    //           style={{ display: 'flex', alignItems: 'flex-start' }}
    //         >
    //           <div style={{ marginLeft: '4px' }}>
    //             <IconShare color={theme.textTertiary} />
    //           </div>
    //           <ActionLabel>Allocate Bounties</ActionLabel>
    //         </ContextMenuItem>
    //       </ActionsMenu>
    //     </StyledSearchBar>
    //     <FilterBar />
    //     <IssuesScrollView>
    //       {this.props.issues.map(({ id, ...issue }) => (
    //         <Issue
    //           isSelected={this.state.selectedIssues.includes(id)}
    //           onSelect={() => {
    //             this.handleIssueSelection(id)
    //           }}
    //           key={id}
    //           {...issue}
    //         />
    //       ))}
    //     </IssuesScrollView>
    //   </StyledIssues>
    // )
  }
}

// // TODO: credit simple-line-icons project
// const Magnifier = () => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     fill="currentColor"
//     width="16"
//     height="16"
//     viewBox="0 0 1024 1024"
//   >
//     <path d="M1014.64 969.04L703.71 656.207c57.952-69.408 92.88-158.704 92.88-256.208 0-220.912-179.088-400-400-400s-400 179.088-400 400 179.088 400 400 400c100.368 0 192.048-37.056 262.288-98.144l310.496 312.448c12.496 12.497 32.769 12.497 45.265 0 12.48-12.496 12.48-32.752 0-45.263zM396.59 736.527c-185.856 0-336.528-150.672-336.528-336.528S210.734 63.471 396.59 63.471c185.856 0 336.528 150.672 336.528 336.528S582.446 736.527 396.59 736.527z" />
//   </svg>
// )

// const StyledIssues = styled.div`
//   height: 100%;
//   padding: 15px 30px;
//   display: flex;
//   flex-direction: column;
//   overflow-y: auto;
//   > :nth-child(3) {
//     border-radius: 3px 3px 0 0;
//     margin-bottom: -1px;
//   }
//   > :nth-child(n + 4) {
//     border-radius: 0;
//     margin-bottom: -1px;
//   }
//   > :last-child {
//     border-radius: 0 0 3px 3px;
//   }
// `

// const StyledSearchBar = styled.div`
//   display: flex;
//   justify-content: space-between;
// `

// const StyledSearchInput = styled.div`
//   position: relative;
//   width: 220px;
//   height: 40px;

//   > :last-child {
//     position: absolute;
//     right: 15px;
//     top: 10px;
//     color: ${theme.textSecondary};
//     pointer-events: none;
//   }
// `

// // TODO: Extract to shared with StyledTextInput from settings
// const StyledTextInput = styled(TextInput).attrs({
//   type: 'text',
// })`
//   width: 100%;
//   border: 1px sold #ccc;
//   padding-right: 35px;
//   font-size: 16px;
// `

// const IssuesScrollView = styled.div`
//   overflow-y: scroll;
//   flex-grow: 1;
//   display: flex;
//   flex-direction: column;
// `

// export default graphql(gql`
//   query {
//     viewer {
//       id
//       repositories(
//         affiliations: [COLLABORATOR, ORGANIZATION_MEMBER, OWNER]
//         first: 20
//         orderBy: { field: NAME, direction: ASC }
//       ) {
//         edges {
//           node {
//             nameWithOwner
//             id
//             issues
//           }
//         }
//       }
//     }
//   }
// `)(Issues)

export default Issues
