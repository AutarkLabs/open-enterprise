import ipfsClient from 'ipfs-http-client'

export const ipfs = ipfsClient({
  host: 'localhost',
  port: '5001',
  protocol: 'http',
})
