import ConfigureVotingName from './ConfigureVotingName'
import ConfigureVotingConditions from './ConfigureVotingConditions'
import ConfigureVotingDefaults from './ConfigureVotingDefaults'
import icon from './assets/icon.svg'

const isIntegerString = value => /^[0-9]*$/.test(value)

const template = {
  name: 'budgetengine',
  label: 'Budget Engine',
  description: 'Determine how much budget to allocate to a single project',
  icon,
  fields: {
    support: {
      defaultValue: () => -1,
      filter: (value, { minQuorum }) => {
        if (!isIntegerString(value)) {
          return { support: -1 }
        }
        const intValue = parseInt(value, 10)
        const support = isNaN(intValue) ? -1 : Math.min(100, Math.max(1, value))
        return {
          support,
          minQuorum: support < minQuorum ? support : minQuorum,
        }
      },
    },
    minQuorum: {
      defaultValue: () => -1,
      filter: (value, { support }) => {
        if (!isIntegerString(value)) {
          return { minQuorum: -1 }
        }
        const intValue = parseInt(value, 10)
        const minQuorum = isNaN(intValue)
          ? -1
          : Math.min(100, Math.max(0, value))
        return {
          minQuorum,
          support: support < minQuorum ? minQuorum : support,
        }
      },
    },
    voteDuration: {
      defaultValue: () => -1,
      filter: value => {
        if (!isIntegerString(value) || value === '') {
          return { voteDuration: -1 }
        }
        const voteDuration = parseInt(value, 10)
        if (isNaN(voteDuration)) {
          return null
        }
        if (voteDuration > Number.MAX_SAFE_INTEGER) {
          return null
        }
        return {
          voteDuration: Math.max(1, value),
        }
      },
    },
  },
  screens: [
    {
      screen: 'voting-name',
      validate: () => {
        // needs adding
        return true
      },
      Component: ConfigureVotingName
    },
    {
      screen: 'voting-conditions',
      validate: () => {
        // needs adding
        return true
      },
      Component: ConfigureVotingConditions
    },
    {
      screen: 'voting-defaults',
      validate: ({ support, minQuorum, voteDuration }) => {
        if (support < 1 || support > 100) {
          return false
        }
        if (minQuorum < 0 || minQuorum > 100) {
          return false
        }
        if (voteDuration < 1) {
          return false
        }
        return true
      },
      Component: ConfigureVotingDefaults,
    },
  ],
  prepareData: ({
    support,
    minQuorum,
    voteDuration,
  }) => {
    return {
      supportNeeded: support / 100,
      minAcceptanceQuorum: minQuorum / 100,
      voteDuration: voteDuration * 60 * 60,
    }
  },
}

export default template

