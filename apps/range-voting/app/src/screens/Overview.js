import React from 'react'
import styled from 'styled-components'
import { Card, Text, EmptyStateCard } from '@aragon/ui'
import emptyIcon from '../assets/empty-card-icon.svg'

const EmptyIcon = () => <img src={emptyIcon} alt="" />

const Content = ({ onActivate }) => (
  <Main>
    <EmptyStateCard
      icon={EmptyIcon}
      title="You have no added any projects."
      text="Get started now by adding a new project."
      actionText="New Project"
      onActivate={onActivate}
    />
  </Main>
)

const Main = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
`

class Overview extends React.Component {
  render () {
    const { onActivate, git } = this.props
    
    if (Object.keys(git.reposManaged).length === 0) {
      return (<Content onActivate={onActivate} />)
    }

    const cards = []
    for (var index in git.reposManaged) {
      if (Object.prototype.hasOwnProperty.call(git.reposManaged, index)) {
        var repo = git.reposManaged[index]
        cards.push(
          <Card>
             <Text>{repo.name}</Text>
          </Card>
        )
      }
    }

    return (
      <div>
        {cards}
      </div>
    )
  }
}

export default Overview
