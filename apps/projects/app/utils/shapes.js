import PropTypes from 'prop-types'

const issueShape = PropTypes.shape({
  balance: PropTypes.string,
  body: PropTypes.string,
  deadline: PropTypes.string,
  exp: PropTypes.number,
  fundingHistory: PropTypes.arrayOf(PropTypes.object),
  hours: PropTypes.string,
  id: PropTypes.string,
  labels: PropTypes.object,
  level: PropTypes.string,
  number: PropTypes.number,
  repo: PropTypes.string,
  repoId: PropTypes.string,
  requestsData: PropTypes.arrayOf(PropTypes.object),
  symbol: PropTypes.string,
  title: PropTypes.string,
  url: PropTypes.string,
  work: PropTypes.object,
  workStatus: PropTypes.oneOf([
    undefined,
    'funded',
    'review-applicants',
    'in-progress',
    'review-work',
    'fulfilled',
  ]),
  workSubmissions: PropTypes.arrayOf(PropTypes.object),
}).isRequired

const userGitHubShape = PropTypes.shape({
  avatarUrl: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  login: PropTypes.string.isRequired,
  addr: PropTypes.string,
}).isRequired

const userDecoupledShape = PropTypes.shape({
  addr: PropTypes.string.isRequired
})

const userShape = PropTypes.oneOfType([
  PropTypes.objectOf(userGitHubShape),
  PropTypes.objectOf(userDecoupledShape)
])

const repoShape = PropTypes.shape({
  data: PropTypes.shape({
    _repo: PropTypes.string,
  }),
  metadata: PropTypes.shape({
    name: PropTypes.string,
    owner: PropTypes.string,
    labels: PropTypes.object,
  })
}).isRequired

export { issueShape, repoShape, userGitHubShape, userDecoupledShape, userShape }
