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
  updatedAt
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
  state
  url
`

export const SEARCH_ISSUES = gql`
  query SearchIssues($after: String, $query: String!) {
    search(
      after:$after,
      first:25,
      query:$query,
      type:ISSUE,
    ) {
      pageInfo {
        endCursor
        hasNextPage
      }
      issues:nodes {
        ... on Issue { ${ issueAttributes } }
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
