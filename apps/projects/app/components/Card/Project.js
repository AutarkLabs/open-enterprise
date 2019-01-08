import React from 'react'
import styled from 'styled-components'
import { IconHistory, IconContributors } from '../Shared'
import {
  Card,
  Text,
  ContextMenu,
  ContextMenuItem,
  IconCross,
  IconHome,
  SafeLink,
  theme,
} from '@aragon/ui'

const colors = {
  iconColor: theme.textTertiary,
  labelColor: theme.textPrimary,
}

const Project = ({ id, label, description, commits, contributors }) => {
  const removeProject = () => {
    console.log('removeProject')
  }

  const clickProject = () => {
    console.log('clickProject')
  }

  const clickContext = () => {
    event.stopPropagation()
    console.log('clickContext')
  }

  return (
    <StyledCard>
      <MenuContainer>
        <ContextMenu>
          <ContextMenuItem>
            <IconHome />
            <ActionLabel>View on GitHub</ActionLabel>
          </ContextMenuItem>
          <ContextMenuItem>
            <IconCross
              style={{ width: '22px', height: '22px', transform: 'scale(0.6)' }}
            />
            <ActionLabel>Remove Project</ActionLabel>
          </ContextMenuItem>
        </ContextMenu>
      </MenuContainer>
      <CardTitle>{label}</CardTitle>
      <CardDescription>{description}</CardDescription>
      <StyledStats>
        <StatsContainer>
          <IconHistory />
          <Text weight="bold">
            {commits}{' '}
            <Text weight="normal" color={theme.textSecondary}>
              {parseInt(commits) === 1 ? 'commit' : 'commits'}
            </Text>
          </Text>
        </StatsContainer>
        <StatsContainer>
          <IconContributors />
          <Text weight="bold">
            {contributors}{' '}
            <Text weight="normal" color={theme.textSecondary}>
              {parseInt(contributors) === 1 ? 'contributor' : 'contributors'}
            </Text>
          </Text>
        </StatsContainer>
      </StyledStats>
    </StyledCard>
  )
}

const StyledCard = styled(Card)`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 12px;
  height: 220px;
  width: 249px;
  transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
  :hover {
    cursor: pointer;
    box-shadow: 0 9px 10px 0 rgba(101, 148, 170, 0.1);
  }
`

const MenuContainer = styled.div`
  align-self: flex-end;
  align-items: center;
`

const ActionLabel = styled.span`
  margin-left: 15px;
`

const CardTitle = styled(Text.Block).attrs({
  size: 'large',
  weight: 'bold',
})`
  margin-top: 15px;
  text-align: center;
  color: ${theme.textPrimary};
`

const CardDescription = styled(Text.Block).attrs({
  size: 'xsmall',
})`
  flex-grow: 1;
  margin: 8px 0;
  text-align: center;
  color: ${theme.textPrimary};
`

const StyledStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-content: stretch;
  position: relative;
`

const StatsContainer = styled(Text).attrs({
  size: 'small',
})`
  display: inline-block;
`

// class Project extends React.Component {
//   render() {
//     const {
//       active,
//       label,
//       description,
//       commits,
//       collaborators,
//       url,
//     } = this.props

//     return (
//       <StyledCard onClick={this.handleClick}>
//         <div onClick={this.handleContextClick}>
//           <ContextMenu>
//             <StyledMenuItem key="cm1" colors={colors}>
//               {React.createElement(IconHome)}
//               <SafeLink
//                 href={url}
//                 target="_blank"
//                 style={{ textDecoration: 'none' }}
//               >
//                 View on GitHub
//               </SafeLink>
//             </StyledMenuItem>
//             <StyledMenuItem key="cm2" onClick={this.removeRepo} colors={colors}>
//               {React.createElement(IconCross)}
//               Remove Project
//             </StyledMenuItem>
//           </ContextMenu>
//         </div>
//         <Text size="large" color={theme.textPrimary}>
//           {label}
//         </Text>
//         <Text size="small" color={theme.textTertiary}>
//           {description}
//         </Text>

//         <StatsItem>
//           <IconHistory />
//           <StatsNumber>{commits}</StatsNumber>
//           commits
//         </StatsItem>
//         <StatsItem>
//           <IconContributors />
//           <StatsNumber>{collaborators}</StatsNumber>
//           contributors
//         </StatsItem>
//       </StyledCard>
//     )
//   }
// }

// const StatsItem = styled.div`
//   color: ${theme.textTertiary};
//   font-size: small;
// `
// const StatsNumber = styled(Text)`
//   font-weight: bold;
//   margin-right: 2px;
// `
// const StyledMenuItem = styled(ContextMenuItem).attrs({
//   iconColor: props => props.colors.iconColor || theme.textPrimary,
//   labelColor: props => props.colors.labelColor || props.colors.iconColor,
// })`
//   color: ${props => props.labelColor};
//   font-weight: bold;
//   width: 248px;
//   & > :first-child {
//     margin-right: 15px;
//     color: ${props => props.iconColor};
//   }
// `
// const StyledCard = styled(Card)`
//   height: 220px;
//   width: 249px;
//   border-radius: 3px;
//   background-color: ${theme.contentBackground};
//   padding: 10px 14px 10px 14px;
//   :hover {
//     /* // border: 1px solid rgba(209, 209, 209, 0.5); */
//     box-shadow: 0 9px 10px 0 rgba(101, 148, 170, 0.1);
//   }

//   transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
//   margin-right: 30px;
//   cursor: pointer;
//   display: grid;
//   grid-template-columns: repeat(4, 25%);
//   grid-template-rows: 50px 20px auto 36px;
//   grid-template-areas:
//     '.    .    .    menu'
//     'labl labl labl labl'
//     'desc desc desc desc'
//     'sta1 sta1 sta2 sta2';
//   grid-gap: 12px 0;

//   & > :nth-child(1) {
//     grid-area: menu;
//     justify-self: end;
//   }
//   & > :nth-child(2) {
//     grid-area: labl;
//     justify-self: center;
//     font-weight: bold;
//   }
//   & > :nth-child(3) {
//     grid-area: desc;
//     font-size: 12px;
//     font-weight: 300;
//     line-height: 14px;
//     justify-self: center;
//     align-items: start;
//     display: flex;
//     text-align: center;
//     overflow-y: hidden;
//     color: ${theme.textPrimary};
//   }
//   & > :nth-child(4) {
//     grid-area: sta1;
//     display: flex;
//     align-items: end;
//     justify-content: flex-start;
//     color: ${theme.textPrimary};
//   }
//   & > :nth-child(5) {
//     grid-area: sta2;
//     display: flex;
//     align-items: end;
//     justify-content: flex-end;
//     color: ${theme.textPrimary};
//   }
// `

export default Project
