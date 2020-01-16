import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { useAragonApi } from '../../../api-react'
import {
  Bar,
  Button,
  BackButton,
  Header,
  IconPlus,
  useLayout,
} from '@aragon/ui'
import { useQuery } from '@apollo/react-hooks'
import useShapedIssue from '../../../hooks/useShapedIssue'
import { GET_ISSUE } from '../../../utils/gql-queries.js'
import { initApolloClient } from '../../../utils/apollo-client'
import EventsCard from './EventsCard'
import DetailsCard from './DetailsCard'
import BountyCard from './BountyCard'
import { usePanelManagement } from '../../Panel'
import usePathSegments from '../../../hooks/usePathSegments'

function Wrap({ children }) {
  const { selectIssue } = usePathSegments()
  const { setupNewIssue } = usePanelManagement()

  return (
    <>
      <Header
        primary="Projects"
        secondary={
          <Button mode="strong" icon={<IconPlus />} onClick={setupNewIssue} label="New issue" />
        }
      />
      <Bar>
        <BackButton onClick={() => selectIssue(null)} />
      </Bar>
      {children}
    </>
  )
}

Wrap.propTypes = {
  children: PropTypes.node.isRequired,
}

const IssueDetail = ({ issueId }) => {
  const { appState: { github } } = useAragonApi()
  const client = useMemo(() => initApolloClient(github.token), [])
  const { layoutName } = useLayout()
  const shapeIssue = useShapedIssue()
  const { loading, error, data } = useQuery(GET_ISSUE, {
    client,
    onError: console.error,
    variables: { id: issueId },
  })
  if (loading) return <Wrap>Loading...</Wrap>
  if (error) return <Wrap>{JSON.stringify(error)}</Wrap>

  const issue = shapeIssue(data.node)
  const columnView = layoutName === 'small' || layoutName === 'medium'

  return (
    <Wrap>
      {columnView ? (
        <div css="display: flex; flex-direction: column">
          <div css={`
                  min-width: 330px;
                  width: 100%;
                  margin-bottom: ${layoutName === 'small' ? '0.2rem' : '2rem'};
                `}
          >
            <DetailsCard issue={issue} />
          </div>
          <div css="min-width: 330px; width: 100%">
            {issue.hasBounty && <BountyCard issue={issue} />}
            <EventsCard issue={issue} />
          </div>
        </div>
      ) : (
        <div css="display: flex; flex-direction: row">
          <div css={`
                  max-width: 705px;
                  min-width: 350px;
                  width: 70%;
                  margin-right: 2rem;
                `}
          >
            <DetailsCard issue={issue} />
          </div>
          <div css="flex-grow: 1">
            {issue.hasBounty && <BountyCard issue={issue} />}
            <EventsCard issue={issue} />
          </div>
        </div>
      )}
    </Wrap>
  )
}

IssueDetail.propTypes = {
  issueId: PropTypes.string.isRequired,
}

export default IssueDetail
