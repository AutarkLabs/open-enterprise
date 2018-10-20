import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { Project, EmptyProjects } from '../Card'

const Overview = ({
  projects,
  onNewProject
}) => {
  if (Object.keys(projects).length === 0) {
    return <EmptyProjects action={onNewProject} />
  }
  return <div>Overview not empty</div>
}

Overview.propTypes = {
  projects: PropTypes.object.isRequired,
  onNewProject: PropTypes.func.isRequired,
}


export default Overview

