import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { IconGitHub } from '../Shared'
import {
  Card,
  Text,
  ContextMenu,
  ContextMenuItem,
  IconCross,
  IconEdit,
  GU,
  Link,
  useLayout,
  useTheme,
} from '@aragon/ui'
import usePathHelpers from '../../../../../shared/utils/usePathHelpers'
import {
  BASE_CARD_WIDTH,
  CARD_STRETCH_BREAKPOINT,
} from '../../utils/responsive'
import { useAragonApi } from '../../api-react'
import { hexToAscii } from 'web3-utils'
import { usePanelManagement } from '../Panel'

const pluralize = (word, number) => `${word}${number > 1 ? 's' : ''}`

const Project = ({
  decoupled,
  description,
  label,
  url,
  repoId
}) => {
  const {
    api: { removeRepo },
    appState: { issues }
  } = useAragonApi()
  const { requestPath } = usePathHelpers()
  const bountiesCount = issues.filter(i =>
    i.data.repoId === repoId &&
    i.data.workStatus !== 'fulfilled' &&
    new Date() < new Date(i.data.deadline)
  ).length
  const theme = useTheme()
  const { width } = useLayout()
  const { editProject } = usePanelManagement()

  const repoIdToAscii = (repoId) => {
    return decoupled ? repoId : hexToAscii(repoId)
  }

  const removeProject = () => {
    removeRepo(repoId).toPromise()
    // TODO: Toast feedback here maybe
  }

  const handleEditProject = () => editProject(repoIdToAscii(repoId), label, description)

  const clickMenu = e => e.stopPropagation()

  const clickContext = e => {
    e.stopPropagation()
    requestPath(`/projects/${repoIdToAscii(repoId)}`)
  }

  return (
    <StyledCard onClick={clickContext} screenSize={width}>

      <div css="display: flex; width: 100%">

        {decoupled || <IconGitHub
          color={`${theme.surfaceIcon}`}
          width="18px"
          height="18px"
        />}

        <MenuContainer onClick={clickMenu}>
          <ContextMenu>
            <div css={`padding: ${GU}px`}>
              {decoupled ? (
                <ContextMenuItem onClick={handleEditProject}>
                  <div css="width: 22px; margin: 4px 2px 0 6px">
                    <IconEdit width="20px" height="20px" color={`${theme.surfaceIcon}`} />
                  </div>
                  <ActionLabel>Edit project</ActionLabel>
                </ContextMenuItem>
              ) : (
                <ContextMenuItem>
                  <div css="width: 22px; margin: 4px 2px 0 6px">
                    <IconGitHub width="18px" height="18px" color={`${theme.surfaceIcon}`} />
                  </div>
                  <ActionLabel>
                    <Link
                      href={url}
                      target="_blank"
                      style={{ textDecoration: 'none', color: theme.surfaceContent }}
                    >
                      View on GitHub
                    </Link>
                  </ActionLabel>
                </ContextMenuItem>
              )}
              <ContextMenuItem onClick={removeProject}>
                <div css="width: 22px; margin: 0 4px; margin-top: 4px">
                  <IconCross width="22px" height="22px" color={`${theme.surfaceIcon}`} />
                </div>
                <ActionLabel>Remove project</ActionLabel>
              </ContextMenuItem>
            </div>
          </ContextMenu>
        </MenuContainer>
      </div>

      <CardTitle>{label}</CardTitle>
      <CardDescription>
        <CardDescriptionText>{description}</CardDescriptionText>
      </CardDescription>
      {!!bountiesCount && (
        <StyledStats>
          <Text size="xsmall">
            {bountiesCount} {pluralize('issue', bountiesCount)} with bounties available
          </Text>
        </StyledStats>
      )}
    </StyledCard>
  )
}

Project.propTypes = {
  decoupled: PropTypes.bool.isRequired,
  description: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  repoId: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
}

const StyledCard = styled(Card)`
  display: flex;
  flex-direction: column;
  margin-bottom: ${2 * GU}px;
  margin-right: ${props =>
    props.screenSize < CARD_STRETCH_BREAKPOINT ? GU : 3 * GU}px;
  justify-content: flex-start;
  padding: 12px;
  height: 240px;
  width: ${props =>
    props.screenSize < CARD_STRETCH_BREAKPOINT
      ? '100%'
      : BASE_CARD_WIDTH + 'px'};
  transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
  :hover {
    cursor: pointer;
    box-shadow: 0 9px 10px 0 rgba(101, 148, 170, 0.1);
  }
`

const MenuContainer = styled.div`
  margin-left: auto;
  align-items: center;
`

const ActionLabel = styled.span`
  margin-left: ${GU}px;
`

const CardTitle = styled(Text.Block).attrs({
  size: 'xlarge',
})`
  margin-top: ${GU}px;
  margin-bottom: ${.6 * GU}px;
  text-align: center;
  display: block;
  /* stylelint-disable-next-line */
  display: -webkit-box;
  /* stylelint-disable-next-line */
  -webkit-line-clamp: 2;
  /* stylelint-disable-next-line */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`

const CardDescriptionText = styled(Text.Block).attrs({
  size: 'large',
})`
  display: block;
  /* stylelint-disable-next-line */
  display: -webkit-box;
  /* stylelint-disable-next-line */
  -webkit-line-clamp: 3;
  /* stylelint-disable-next-line */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
`

const CardDescription = styled.div`
  flex-grow: 1;
`

const StyledStats = styled.div`
  margin-bottom: ${3 * GU}px;
`

export default Project
