import React from 'react'
import { useInstalledApps } from '@aragon/api-react'
import { IconLabel, IdentityBadge, GU, Link, useTheme } from '@aragon/ui'
import { useIdentity } from './IdentityManager'
import LocalLabelPopoverTitle from './LocalLabelPopoverTitle'
import LocalLabelPopoverActionLabel from './LocalLabelPopoverActionLabel'

const LocalIdentityBadge = ({ entity, networkType, ...props }) => {
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
            href={kernel && networkType !== 'private'
              ? `https://beta.autark.xyz/#/${kernel}/profile/${entity}`
              : `https://www.3box.io/${entity}`
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: theme.contentSecondary
            }}
          >
            <IconLabel
              style={{
                marginRight: `${1 * GU}px`
              }}
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
      networkType={networkType}
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
