import axios from 'axios'
import ipfsClient from 'ipfs-http-client'

let autarkIpfs = ipfsClient({ host: 'ipfs.autark.xyz', port: '5001', protocol: 'https' })
const ipfsEndpoint = 'https://ipfs.autark.xyz:5001/api/v0'

const bufferFile = (content) => autarkIpfs.types.Buffer.from(JSON.stringify(content))

export const ipfsAdd = async (content) => {
  const formData = new FormData()
  const val = new Blob([bufferFile(content)])
  formData.append('entry', val)

  try {
    const result = await axios.post(
      'http://localhost:3612/api/v0/files/add',
      formData
    )

    return result.data
  } catch (err) {
    console.error('Error pinning file to IPFS', err)
  }
}

// compute the hashes individually, then join them together into one string
// this is specific for our bounty smart contract interface
export const computeIpfsString = async issues => {
  const issueHashArray =
    await Promise.all(issues.map(async issue => await ipfsAdd(issue)))
  return issueHashArray.join('')
}

export const ipfsGet = async (hash) => {
  const endpoint = `http://localhost:3612/api/v0/cat?arg=${hash}`
  try {
    const { data } = await axios.get(endpoint)
    return data
  } catch (err) {
    console.error('Error getting data from IPFS', err)
  }
}
