import isIPFS from 'is-ipfs'

import { worksFor, schoolAffiliation, homeLocation } from './things'

const usedFields = new Set([
  'name',
  'jobTitle',
  'homeLocation',
  'affiliation',
  'url',
  'description',
  'image',
  'worksFor',
])

const handleJobTitle = publicProfile => {
  if (publicProfile.jobTitle) return publicProfile
  if (publicProfile.job)
    return { ...publicProfile, jobTitle: publicProfile.job }
  return publicProfile
}

const handleEmployer = publicProfile => {
  const isProperlyStructured =
    publicProfile.worksFor && Object.keys(publicProfile.worksFor).length > 0
  if (isProperlyStructured) return publicProfile
  if (publicProfile.employer) {
    return { ...publicProfile, worksFor: worksFor(publicProfile.employer) }
  }
  return publicProfile
}

const handleEducation = publicProfile => {
  const hasEducation = !!publicProfile.school
  if (!hasEducation) return publicProfile

  const hasAffiliation =
    publicProfile.affiliation && publicProfile.affiliation.length > 0

  if (hasAffiliation) {
    const isProperlyStructured = publicProfile.affiliation.some(
      affiliation => affiliation['@type'] === 'School'
    )
    if (isProperlyStructured) return publicProfile
    return {
      ...publicProfile,
      affiliation: schoolAffiliation(
        publicProfile.school,
        publicProfile.affiliation
      ),
    }
  }

  return {
    ...publicProfile,
    affiliation: schoolAffiliation(publicProfile.school, []),
  }
}

const handleWebsite = publicProfile => {
  if (publicProfile.url) return publicProfile
  if (publicProfile.website)
    return { ...publicProfile, url: publicProfile.website }
  return publicProfile
}

const handleLocation = publicProfile => {
  const isProperlyStructured =
    publicProfile.homeLocation &&
    Object.keys(publicProfile.homeLocation).length > 0
  if (isProperlyStructured) return publicProfile
  if (publicProfile.location) {
    return {
      ...publicProfile,
      homeLocation: homeLocation(publicProfile.location),
    }
  }
  return publicProfile
}

const handlePerson = publicProfile => {
  const isPerson =
    publicProfile['@type'] === 'Person' &&
    publicProfile['@context'] === 'http://schema.org/'

  if (isPerson) return publicProfile
  return {
    ...publicProfile,
    '@type': 'Person',
    '@context': 'http://schema.org/',
  }
}

export const reformatImage = publicProfile => {
  const hasImage = !!publicProfile.image
  if (!hasImage) return publicProfile
  const isProperlyTyped =
    publicProfile.image['@type'] === 'ImageObject' &&
    publicProfile.image['@context'] === 'http://schema.org/' &&
    Array.isArray(publicProfile.image) &&
    publicProfile.image.length > 0 &&
    publicProfile.image[0].contentUrl

  const isIPLD =
    typeof publicProfile.image[0].contentUrl === 'object' &&
    isIPFS.cid(publicProfile.image[0].contentUrl['/'])

  if (isProperlyTyped && !isIPLD) return publicProfile
  return publicProfile
}

/* prettier-ignore */
export const format = publicProfile => {
  const formattedProfile =
    handlePerson(
        handleLocation(
          handleWebsite(
            handleEducation(
              handleEmployer(
                handleJobTitle(publicProfile))))))
  return formattedProfile
}

export const populateFormValue = publicProfile => {
  const strippedObject = {}
  Object.keys(publicProfile)
    .filter(field => usedFields.has(field))
    .forEach(field => (strippedObject[field] = publicProfile[field]))

  return strippedObject
}

/*
      name: publicProfile.name || '',
      job: publicProfile.job || '',
      location: publicProfile.location || '',
      school: publicProfile.school || '',
      website: publicProfile.website || '',
      description: publicProfile.description || '',
*/
