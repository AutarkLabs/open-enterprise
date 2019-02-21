import { gql } from 'apollo-boost'

export const GET_ISSUES = gql`
  query getIssuesForRepos($reposIds: [ID!]!) {
    nodes(ids: $reposIds) {
      ... on Repository {
        issues(last: 100) {
          nodes {
            number
            id
            title
            body
            createdAt
            repository {
              id
              name
            }
            labels(first: 30) {
              totalCount
              edges {
                node {
                  id
                  name
                  description
                  color
                }
              }
            }
            milestone {
              id
              title
            }
            state
            url
          }
        }
      }
    }
  }
`
export const NEW_ISSUE = gql`
  mutation create($title: String!, $description: String, $id: ID!) {
    createIssue(
      input: { title: $title, body: $description, repositoryId: $id }
    ) {
      issue {
        id
      }
    }
  }
`
export const CURRENT_USER = gql`
  query {
    viewer {
      id
      login
      url
      avatarUrl
    }
  }
`
