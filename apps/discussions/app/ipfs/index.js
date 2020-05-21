import axios from 'axios'
import ipfsClient from 'ipfs-http-client'

const environments = {
  development: { host: 'localhost', port: '5001', protocol: 'http' },
  production: { host: 'ipfs.autark.xyz', port: '5001', protocol: 'https' },
  staging: { host: 'ipfs.autark.xyz', port: '5001', protocol: 'https' },
}

const config = environments[process.env.NODE_ENV]

export const ipfs = ipfsClient(config)

export const ipfsGet = async hash => {
  const endpoint = `${config.protocol}://${config.host}:8080/ipfs/${hash}`
  try {
    const { data } = await axios.get(endpoint)
    return data
  } catch (err) {
    console.error('Error getting data from IPFS', err)
  }
}
