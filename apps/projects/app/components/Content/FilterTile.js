import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Badge } from '@aragon/ui'

import IconX from '../shared/assets/components/IconX'

export default class FilterTile extends PureComponent {
  static propTypes = {
    text: PropTypes.string.isRequired,
    disableFilter: PropTypes.func.isRequired,
  }
  render() {
    return (
      <div style={{ marginLeft: '4px' }}>
        <Badge.Identity>
          <div style={{
            paddingLeft: '10px',
            paddingTop: '4px',
            paddingBottom: '4px',
            display: 'flex',
            flexDirection: 'row'
          }}>
            {this.props.text}
            <div
              style={{
                marginLeft: '10px',
                paddingRight: '4px',
                cursor: 'pointer'
              }}
              role="button" aria-pressed="false"
              onClick={this.props.disableFilter}
            >
              <IconX height='8px' width='8px' />
            </div>
          </div>
        </Badge.Identity>
      </div>
    )
  }
}
