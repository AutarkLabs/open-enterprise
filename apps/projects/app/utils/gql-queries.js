import { gql } from 'apollo-boost'

export const issueAttributes = `
  number
  id
  title
  body
  author {
    login
    avatarUrl
    url
  }
  createdAt
  repository {
    id
    name
  }
  labels(first: 50) {
    totalCount
    edges {
      node {
        id
        name
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
`

export const getIssuesGQL =  gql`
  query GetIssuesForRepo($repoId: ID!, $count: Int, $after: String)  {
    repository: node(id: $repoId) {
      ... on Repository {
        issues(
          states:OPEN,
          first: $count,
          after: $after,
          orderBy: {field: CREATED_AT, direction: DESC}
        ) {
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
          nodes { ${issueAttributes} }
        }
      }
    }
  }
`

export const GET_ISSUE = gql`
  query GetIssue($id: ID!) {
    node(id: $id) {
      ... on Issue { ${issueAttributes} }
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
export const GET_REPOSITORIES = gql`
  query {
    viewer {
      id
     repositories(
       first: 100,
       orderBy: {field: UPDATED_AT, direction: DESC}
       ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER],
       affiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]) {
       totalCount
       edges {
        node {
          nameWithOwner
          id
          owner {
            id
          }
        }
      }
     }
   }
 }
`
export const COMMENT = gql`
  mutation comment($body: String!, $subjectId: ID!) {
    addComment(
      input: { body: $body, subjectId: $subjectId }
    ) {
      subject {
        id
      }
    }
  }
`
