import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Form, FormField } from '../Form'
import { TextInput, DropDown } from '@aragon/ui'
import web3Utils from 'web3-utils'

// TODO: fields validation and error handling need improvement!

const ENTITY_TYPES = ['Individual', 'Organisation', 'Project']

class NewEntity extends React.Component {
  static propTypes = {
    onCreateEntity: PropTypes.func.isRequired,
  }

  state = {
    data: {
      eName: '',
      eAddress: '',
      eType: 0
    },
    err: {
      eName: '',
      eAddress: '',
    }
  }

  changeField = e => {
    var data = this.state.data
    var err = this.state.err

    if (typeof e === 'number') { // the only DD here is entity type
      data.eType = e
    } else {
      data[e.target.name] = e.target.value
      err[e.target.name] = ''
    }
    this.setState({ data, err })
  }

  handleSubmit = () => {
    if (this.state.data.eName === '') {
      this.setState({ err: { eName: 'Please provide a name'}})
    } else if (! web3Utils.isAddress(this.state.data.eAddress)) {
      this.setState({ err: { eAddress: 'Please provide a valid address'}})
    } else {
      this.props.onCreateEntity(this.state.data)
    }
  }

  render() {
    return (
      <Form
        onSubmit={this.handleSubmit}
        submitText="Submit Entity"
      >
        <FormField
          required
          label="Name"
          err={this.state.err.eName}
          input={
            <TextInput name="eName" onChange={this.changeField} wide />
          }
        />

        <FormField
          required
          label="Address"
          err={this.state.err.eAddress}
          input={
            <TextInput name="eAddress" onChange={this.changeField} wide />
          }
        />

        <FormField
          label="Type"
          input={
          <DropDown
            name="eType"
            items={ENTITY_TYPES}
            onChange={this.changeField}
            wide
          />
          }
        />
      </Form>
    )
  }
}

export default NewEntity
