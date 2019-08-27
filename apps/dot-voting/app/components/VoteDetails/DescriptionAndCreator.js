import React from 'react'
import PropTypes from 'prop-types'
import { useNetwork } from '@aragon/api-react'
import { GU, useLayout } from '@aragon/ui'
import { LocalIdentityBadge } from '../../../../../shared/identity'
import Label from './Label'

const DescriptionAndCreator = ({ creator, question, description }) => {
  const network = useNetwork()
  const { layoutName } = useLayout()
  return (
    <div
      css={`
        display: grid;
        grid-template-columns: ${layoutName === 'large' ? 'auto auto' : 'auto'};
        grid-gap: ${layoutName === 'large' ? 5 * GU : 2.5 * GU}px;
        margin-bottom: ${2 * GU}px;
      `}
    >
      <div>
        <Label>
          Description
        </Label>
        <div>
          {question === description ? '' : description}
        </div>
      </div>
      <div>
        <Label>
          Created By
        </Label>
        <div css="display: flex; align-items: flex-start">
          <LocalIdentityBadge
            networkType={network.type}
            entity={creator}
            shorten
          />
        </div>
      </div>
    </div>
  )
}

DescriptionAndCreator.propTypes = {
  creator: PropTypes.string.isRequired,
  question: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
}

DescriptionAndCreator.defaultProps = {
  question: '',
  description: '',
}

export default DescriptionAndCreator
