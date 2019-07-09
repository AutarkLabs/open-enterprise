import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Badge, theme } from '@aragon/ui'

import IconX from '../Shared/assets/components/IconX'

const Button = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
  outline: none;
  padding: 0 4px 0 10px;
  :hover, :focus, :active {
    polygon, rect {
      fill: ${theme.negative};
    }
  }
`

export default class FilterTile extends PureComponent {
  static propTypes = {
    text: PropTypes.string.isRequired,
    disableFilter: PropTypes.func.isRequired,
  }
  render() {
    return (
      <Tile>
        <Badge.Identity>
          <div
            style={{
              paddingLeft: '10px',
              paddingTop: '4px',
              paddingBottom: '4px',
              display: 'flex',
              flexDirection: 'row',
            }}
          >
            {this.props.text}
            <Button onClick={this.props.disableFilter}>
              <IconX height="8px" width="8px" />
            </Button>
          </div>
        </Badge.Identity>
      </Tile>
    )
  }
}

const Tile = styled.div`
  display: inline-block;
  margin: 1px 4px 1px 0;
`
