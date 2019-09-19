import PropTypes from 'prop-types'
import React from 'react'

import {
  DescriptionInput,
  DropDownOptionsInput,
  Form,
  FormField,
} from '../../Form'
import { useAragonApi } from '../../../api-react'
import { usePanelManagement } from '..'

const issueShape = PropTypes.shape({
  id: PropTypes.string,
  title: PropTypes.string,
  number: PropTypes.number,
  repo: PropTypes.string,
})

class NewIssueCuration extends React.Component {
  static propTypes = {
    allIssues: PropTypes.arrayOf(issueShape),
    onSubmit: PropTypes.func.isRequired,
    /** array of issues to allocate bounties on */
    selectedIssues: PropTypes.arrayOf(issueShape),
    /** base rate in pennies */
    // rate: PropTypes.number,
    // onSubmit: PropTypes.func,
  }
  // TODO: Work with only id fields when possible and read rest of data from cache with a context helper
  state = {
    selectedIssues: this.props.selectedIssues,
    issuesInput: '',
    description: '',
  }

  // TODO: improve field checking for input errors and sanitize
  changeField = ({ target: { name, value } }) => {
    this.setState({ [name]: value })
  }

  submitCuration = () => {
    this.props.onSubmit(this.state.selectedIssues, this.state.description)
  }

  render() {
    return (
      <Form onSubmit={this.submitCuration} submitText="Submit Curation">
        <FormField
          required
          label="Description"
          input={
            <DescriptionInput
              name="description"
              value={this.state.description}
              onChange={this.changeField}
              placeholder="Describe your proposal."
            />
          }
        />
        <FormField
          label="Issues"
          required
          input={
            <DropDownOptionsInput
              name="issues"
              placeholder="Select option..."
              onChange={this.changeField}
              values={this.state.selectedIssues}
              input={this.state.issuesInput}
              allOptions={this.props.allIssues}
            />
          }
        />
      </Form>
    )
  }
}

const onSubmitCuration = ({ closePanel, curateIssues }) => (
  issues,
  description
) => {
  closePanel()
  // TODO: maybe assign this to issueDescriptionIndices, not clear
  let issueDescriptionIndices = []
  issues.forEach((issue, i) => {
    if (i === 0) {
      issueDescriptionIndices.push(issue.title.length)
    } else {
      issueDescriptionIndices.push(issue.title.length)
    }
  })

  // TODO: splitting of descriptions needs to be fixed at smart contract level
  const issueDescriptions = issues.map(issue => issue.title).join('')
  /* TODO: The numbers below are supposedly coming from an eventual:
   issues.map(issue => web3.utils.hexToNum(toHex(issue.repoId))) */
  const issueNumbers = issues.map(issue => issue.number)
  const emptyIntArray = new Array(issues.length).fill(0)
  const emptyAddrArray = [
    '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
    '0xd00cc82a132f421bA6414D196BC830Db95e2e7Dd',
    '0x89c199302bd4ebAfAa0B5Ee1Ca7028C202766A7F',
    '0xd28c35a207c277029ade183b6e910e8d85206c07',
    '0xee6bd04c6164d7f0fa1cb03277c855639d99a7f6',
    '0xb1d048b756f7d432b42041715418b48e414c8f50',
    '0x6945b970fa107663378d242de245a48c079a8bf6',
    '0x83ac654be75487b9cfcc80117cdfb4a4c70b68a1',
    '0x690a63d7023780ccbdeed33ef1ee62c55c47460d',
    '0xb1afc07af31795d61471c169ecc64ad5776fa5a1',
    '0x4aafed050dc1cf7e349accb7c2d768fd029ece62',
    '0xd7a5846dea118aa76f0001011e9dc91a8952bf19',
  ]

  curateIssues(
    emptyAddrArray.slice(0, issues.length),
    emptyIntArray,
    issueDescriptionIndices,
    issueDescriptions,
    description,
    emptyIntArray,
    issueNumbers,
    1
  )
}

// TODO: move entire component to functional component
// the following was a quick way to allow us to use hooks
const NewIssueCurationWrap = props => {
  const { api } = useAragonApi()
  const { closePanel } = usePanelManagement()
  return (
    <NewIssueCuration
      onSubmit={onSubmitCuration({
        curateIssues: api.curateIssues,
        closePanel,
      })}
      {...props}
    />
  )
}

export default NewIssueCurationWrap
