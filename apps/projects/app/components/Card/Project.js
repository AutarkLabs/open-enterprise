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
  breakpoint,
} from '@aragon/ui'
import { BASE_CARD_WIDTH, CARD_STRETCH_BREAKPOINT } from '../../utils/responsive'

const colors = {
  iconColor: theme.textTertiary,
  labelColor: theme.textPrimary,
}

const Project = ({
  id,
  repoId,
  label,
  description,
  commits,
  url,
  contributors,
  onRemoveProject,
  changeActiveIndex,
  screenSize,
}) => {
  const removeProject = () => {
    onRemoveProject(repoId)
  }

  const clickMenu = e => e.stopPropagation()

  const clickContext = e => {
    e.stopPropagation()
    changeActiveIndex({ tabIndex: 1, tabData: { filterIssuesByRepoId: repoId } })
  }

  return (
    <StyledCard onClick={clickContext} screenSize={screenSize}>
      <MenuContainer onClick={clickMenu}>
        <ContextMenu>
          <ContextMenuItem>
            <IconHome />
            <ActionLabel>
              <SafeLink
                href={url}
                target="_blank"
                style={{ textDecoration: 'none' }}
              >
                View on GitHub
              </SafeLink>
            </ActionLabel>
          </ContextMenuItem>
          <ContextMenuItem onClick={removeProject}>
            <IconCross
              style={{ width: '22px', height: '22px', transform: 'scale(0.6)' }}
            />
            <ActionLabel>Remove Project</ActionLabel>
          </ContextMenuItem>
        </ContextMenu>
      </MenuContainer>
      <CardTitle>{label}</CardTitle>
      <CardDescription>
        <CardDescriptionText>
          {description}
        </CardDescriptionText>
      </CardDescription>
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
        {/* <StatsContainer> */}
        {/* <IconContributors /> */}
        {/* <Text weight="bold">
            {contributors}{' '}
            <Text weight="normal" color={theme.textSecondary}>
              {parseInt(contributors) === 1 ? 'contributor' : 'contributors'}
            </Text>
          </Text> */}
        {/* </StatsContainer> */}
      </StyledStats>
    </StyledCard>
  )
}

const StyledCard = styled(Card)`
  display: flex;
  ${breakpoint(
    'small',
    `
    margin-bottom: 2rem;
    `
  )};
  margin-bottom: 0.3rem;
  margin-right: ${props => props.screenSize < CARD_STRETCH_BREAKPOINT ? '0.6rem' : '2rem' };
  flex-direction: column;
  justify-content: flex-start;
  padding: 12px;
  height: 240px;
  width: ${props => props.screenSize < CARD_STRETCH_BREAKPOINT ? '100%' : BASE_CARD_WIDTH + 'px' };
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
  margin-top: 10px;
  margin-bottom: 5px;
  text-align: center;
  color: ${theme.textPrimary};
  display: block;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`

const CardDescriptionText = styled(Text.Block).attrs({
  size: 'xsmall',
})`
  display: block;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${theme.textPrimary};
  text-align: center;
`

const CardDescription = styled.div`
  flex-grow: 1;
`

const StyledStats = styled.div`
  display: flex;
  justify-content: center;
  align-content: stretch;
`

const StatsContainer = styled(Text).attrs({
  size: 'small',
})`
  display: inline-block;
`

export default Project
