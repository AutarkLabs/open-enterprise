import React from 'react'
import styled from 'styled-components'
import {
  Card,
  Text,
  theme,
  ContextMenu,
  ContextMenuItem,
  IconCross,
  IconHome,
  SafeLink
} from '@aragon/ui'
import { noop } from '../utils/utils'

const { textPrimary, textTertiary } = theme

const initialState = {
}

class RepoCard extends React.Component {
  static defaultProps = {
    template: null,
    active: false,
    onSelect: noop,
    label: '',
    description: ''
  }
  state = {
    ...initialState,
  }

  handleClick = event => {
    console.log('handleClick')
    console.log(event)
    this.props.onSelect(this.props.repoId)
  }

  handleContextClick = event => {
    event.stopPropagation()
  }

  removeRepo = event => {
    this.props.onRemove(this.props.repoId)
  }

  render() {
    const { active, label, description, commits, collaborators, url } = this.props
    const colors={
          iconColor: textTertiary,
          labelColor: textPrimary
    }
    return (
      <StyledCard onClick={this.handleClick}>
        <div onClick={this.handleContextClick}>
          <ContextMenu>
            <StyledMenuItem
              key="cm1"
              colors={colors}
            >
              {React.createElement(IconHome)}
              <SafeLink href={url} target="_blank" style={{ textDecoration: 'none' }}>
                View on GitHub
              </SafeLink>
            </StyledMenuItem>
            <StyledMenuItem
              key="cm2"
              onClick={this.removeRepo}
              colors={colors}
            >
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
          {React.createElement(IconHome)}
          <StatsNumber>
            {commits}
          </StatsNumber>
	  commits
       </StatsItem>
       <StatsItem>
          {React.createElement(IconHome)}
          <StatsNumber>
            {collaborators}
          </StatsNumber>
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
const StyledMenuItem = styled(ContextMenuItem)
.attrs({
    iconColor: props =>
        props.colors.iconColor || textPrimary,
    labelColor: props =>
        props.colors.labelColor || props.colors.iconColor
})`
    color: ${props => props.labelColor}
    font-weight: bold;
    width: 248px;
    & > :first-child {
        margin-right: 15px;
        color: ${props => props.iconColor};
    }
`
const StyledCard = styled(Card)`
  cursor: pointer;
  height: 272px;
  width: 280px;
  display: grid;
  grid-template-columns: repeat(4, 25%);
  grid-template-rows: 70px 24px auto 34px;
  grid-template-areas:
    ".    .    .    menu"
    "labl labl labl labl"
    "desc desc desc desc"
    "sta1 sta1 sta2 sta2";
       
  grid-gap: 12px 0;

  & > :nth-child(1) {
    grid-area: menu;
    margin-left: 10px;
    margin-top: 10px;
  }
  & > :nth-child(2) {
    grid-area: labl;
    justify-self: center;
    font-weight: bold;
  }
  & > :nth-child(3) {
    grid-area: desc;
    font-size: small;
    justify-self: center;
    padding: 0px 10px;
    display: flex;
    text-align: center;
    overflow-y: auto;
  }
  & > :nth-child(4) {
    grid-area: sta1;
    padding: 10px;
    display: flex;
    align-items: center;
  }
  & > :nth-child(5) {
   grid-area: sta2;
   display: flex;
   align-items: center;
   padding: 10px;
  }
`

export default RepoCard

