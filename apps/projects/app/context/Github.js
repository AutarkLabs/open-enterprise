import React from 'react'

export const GithubContext = React.createContext()

export const withGithub = Component => props => (
  <GithubContext.Consumer>
    {value => <Component {...props} github={value} />}
  </GithubContext.Consumer>
)
