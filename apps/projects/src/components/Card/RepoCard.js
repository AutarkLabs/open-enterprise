import React from 'react'
import styled from 'styled-components'
import { IconHistory, IconContributors } from '../../assets'
import {
  Card,
  Text,
  theme,
  ContextMenu,
  ContextMenuItem,
  IconCross,
  IconHome,
  SafeLink,
} from '@aragon/ui'

const { textPrimary, textTertiary } = theme

const initialState = {}

class RepoCard extends React.Component {
  static defaultProps = {
    template: null,
    active: false,
    onSelect: '',
    label: '',
    description: '',
  }
  state = {
    ...initialState,
  }

  handleClick = event => {
    this.props.onSelect(this.props.repoId)
  }

  handleContextClick = event => {
    event.stopPropagation()
  }

  removeRepo = event => {
    this.props.onRemove(this.props.repoId)
  }

  render() {
    const {
      active,
      label,
      description,
      commits,
      collaborators,
      url,
    } = this.props
    const colors = {
      iconColor: textTertiary,
      labelColor: textPrimary,
    }
    return (
      <StyledCard onClick={this.handleClick}>
        <div onClick={this.handleContextClick}>
          <ContextMenu>
            <StyledMenuItem key="cm1" colors={colors}>
              {React.createElement(IconHome)}
              <SafeLink
                href={url}
                target="_blank"
                style={{ textDecoration: 'none' }}
              >
                View on GitHub
              </SafeLink>
            </StyledMenuItem>
            <StyledMenuItem key="cm2" onClick={this.removeRepo} colors={colors}>
              {React.createElement(IconCross)}
              Remove Project
            </StyledMenuItem>
          </ContextMenu>
        </div>
        <Text size="large" color={textPrimary}>
          {label}
        </Text>
        <Text size="small" color={textTertiary}>
          {description}
        </Text>

        <StatsItem>
          <IconHistory />
          <StatsNumber>{commits}</StatsNumber>
          commits
        </StatsItem>
        <StatsItem>
          <IconContributors />
          <StatsNumber>{collaborators}</StatsNumber>
          contributors
        </StatsItem>
      </StyledCard>
    )
  }
}

const StatsItem = styled.div`
  color: ${theme.textTertiary};
  font-size: small;
`
const StatsNumber = styled(Text)`
  font-weight: bold;
  margin-right: 2px;
`
const StyledMenuItem = styled(ContextMenuItem).attrs({
  iconColor: props => props.colors.iconColor || textPrimary,
  labelColor: props => props.colors.labelColor || props.colors.iconColor,
})`
  color: ${props => props.labelColor};
  font-weight: bold;
  width: 248px;
  & > :first-child {
    margin-right: 15px;
    color: ${props => props.iconColor};
  }
`
const StyledCard = styled(Card)`
  height: 220px;
  max-width: 249px;
  border-radius: 3px;
  background-color: #feffff;
  padding: 10px 14px 10px 14px;
  :hover {
    /* // border: 1px solid rgba(209, 209, 209, 0.5); */
    box-shadow: 0 9px 10px 0 rgba(101, 148, 170, 0.1);
  }
  transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
  margin-right: 30px;
  cursor: pointer;
  display: grid;
  grid-template-columns: repeat(4, 25%);
  grid-template-rows: 50px 20px auto 36px;
  grid-template-areas:
    '.    .    .    menu'
    'labl labl labl labl'
    'desc desc desc desc'
    'sta1 sta1 sta2 sta2';

  grid-gap: 12px 0;

  & > :nth-child(1) {
    grid-area: menu;
    justify-self: end;
  }
  & > :nth-child(2) {
    grid-area: labl;
    justify-self: center;
    font-weight: bold;
  }
  & > :nth-child(3) {
    grid-area: desc;
    font-size: 12px;
    font-weight: 300;
    line-height: 14px;
    justify-self: center;
    align-items: start;
    display: flex;
    text-align: center;
    overflow-y: hidden;
    color: ${theme.textPrimary};
  }
  & > :nth-child(4) {
    grid-area: sta1;
    display: flex;
    align-items: end;
    justify-content: flex-start;
    color: ${theme.textPrimary};
  }
  & > :nth-child(5) {
    grid-area: sta2;
    display: flex;
    align-items: end;
    justify-content: flex-end;
    color: ${theme.textPrimary};
  }
`

export default RepoCard
