import React from 'react'
import { useInstalledApps, useNetwork } from '../../api-react'
import { GU, IconLabel, IdentityBadge, Link, useTheme } from '@aragon/ui'
import { useIdentity } from './IdentityManager'
import LocalLabelPopoverTitle from './LocalLabelPopoverTitle'
import LocalLabelPopoverActionLabel from './LocalLabelPopoverActionLabel'

const LocalIdentityBadge = ({ entity, ...props }) => {
  const network = useNetwork()
  const installedApps = useInstalledApps()
  const kernel = installedApps.find(app => app.name === 'Kernel').appAddress
  const [ label, source, handleShowLocalIdentityModal ] = useIdentity(entity)
  const handleCustomLabel = () => handleShowLocalIdentityModal(entity)
  const handleProfile = () => {}
  const getPopoverAction = () => {
    const theme = useTheme()
    //if(source === 'addressBook') return null
    if(source === '3box') {
      return {
        label: (
          <Link
            href={kernel && network.type !== 'private'
              ? `https://beta.autark.xyz/#/${kernel}/profile/${entity}`
              : `https://www.3box.io/${entity}`
            }
            css={`
              display: flex;
              align-items: center;
              text-decoration: none;
              color: ${theme.contentSecondary}
            `}
          >
            <IconLabel
              css={`
                margin-right: ${1 * GU}px;
              `}
            />
            View profile
          </Link>
        ),
        onClick: handleProfile
      }
    }
    return {
      label: <LocalLabelPopoverActionLabel hasLabel={Boolean(label)} />,
      onClick: handleCustomLabel
    }
  }

  return (
    <IdentityBadge
      label={label || ''}
      entity={entity}
      networkType={network && network.type}
      popoverAction={getPopoverAction()}
      popoverTitle={
        <LocalLabelPopoverTitle label={label || ''} source={source}/>
      }
      {...props}
    />
  )
}

LocalIdentityBadge.propTypes = {
  ...IdentityBadge.propTypes,
}

export default LocalIdentityBadge
