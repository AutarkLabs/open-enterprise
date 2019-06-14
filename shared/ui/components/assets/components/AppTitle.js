import { Text } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { MenuButton } from '.'

const Wrap = styled.div`
  display: flex;
  align-items: center;
  margin-left: 30px;
`

const AppTitle = props => (
  <Wrap>
    {props.displayMenuButton && <MenuButton />}
    <Text size="xxlarge">{props.title}</Text>
  </Wrap>
)

AppTitle.propTypes = {
  title: PropTypes.string.isRequired,
  displayMenuButton: PropTypes.bool.isRequired,
}

export default AppTitle
