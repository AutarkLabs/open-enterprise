import React, { useState, useEffect, createContext } from 'react'
import PropTypes from 'prop-types'

const DiscussionsContext = createContext({})

const Discussions = ({children, app}) => {
  const [mount, setMount] = useState(false)
  useEffect(() => {
    const initDiscussions = async () => {

    }

    if (!mount) {
      initDiscussions()
      setMount(true)
    }
  })

}

export default Discussions
