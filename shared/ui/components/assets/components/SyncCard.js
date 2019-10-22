import React, { Fragment } from 'react'
import { Button, EmptyStateCard, GU, LoadingRing } from '@aragon/ui'
import Empty from './Empty'

export default () => (
  <EmptyStateCard
      text={
          <div
            css={`
              display: grid;
              align-items: center;
              justify-content: center;
              grid-template-columns: auto auto;
              grid-gap: ${1 * GU}px;
            `}
          >
            <LoadingRing />
            <span>Syncing…</span>
          </div>

      }
      action={<Fragment />}
      illustration={
        <img
          css={`
            margin: auto;
            height: 170px;
          `}
          src={Empty}
          alt="Syncing your project data. Hang tight homie!"
        />
      }
    />
)
