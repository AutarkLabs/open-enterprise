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

const Project = ({
  id,
  repoId,
  label,
  description,
  commits,
  url,
  contributors,
  onRemoveProject,
  changeActiveIndex
}) => {

  const removeProject = () => {
    console.log('removeProject')
    onRemoveProject(id)
  }

  const clickMenu = e => e.stopPropagation()

  const clickContext = e => {
    e.stopPropagation()
    changeActiveIndex({ tabIndex: 1, tabData: { filterIssuesByRepoId: repoId }})
  }

  return (
    <StyledCard onClick={clickContext}>
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

const CardDescriptionText = styled(Text.Block).attrs({
  size: 'xsmall',
})`
  display: block;
  display: -webkit-box;
  height: 7.1em;
  margin: 0 auto;
  line-height: 1.5em;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 8px 0;
  text-align: center;
  color: ${theme.textPrimary};
`

const CardDescription = styled.div`
  flex-grow: 1;
`

const StyledStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-content: stretch;
`

const StatsContainer = styled(Text).attrs({
  size: 'small',
})`
  display: inline-block;
`

export default Project
