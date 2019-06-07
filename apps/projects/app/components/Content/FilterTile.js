import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Badge } from '@aragon/ui'

import IconX from '../Shared/assets/components/IconX'

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
            <div
              style={{
                marginLeft: '10px',
                paddingRight: '4px',
                cursor: 'pointer',
              }}
              role="button"
              aria-pressed="false"
              onClick={this.props.disableFilter}
            >
              <IconX height="8px" width="8px" />
            </div>
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
