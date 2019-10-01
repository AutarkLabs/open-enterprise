import { handleEvent } from './events'

jest.mock('@aragon/api')

// mock app.call
// mock ipfsGet
// mock bountyContract.call

const DEFAULT_TOKENS = [{ 'addr':'0x0000000000000000000000000000000000000000','symbol':'ETH','decimals':'18','balance':'99000000000000000000' }]
const DEFAULT_BOUNTY_SETTINGS = { '0':[ '100','300','500' ],'1':[ '0x426567696e6e6572000000000000000000000000000000000000000000000000','0x496e7465726d6564696174650000000000000000000000000000000000000000','0x416476616e636564000000000000000000000000000000000000000000000000' ],'2':'100','3':'336','4':'0x0000000000000000000000000000000000000000','5':'0x46bC737df7f1B3a7436F942813498CBE041a6ea4','expMultipliers':[ '100','300','500' ],'expLevels':[ '0x426567696e6e6572000000000000000000000000000000000000000000000000','0x496e7465726d6564696174650000000000000000000000000000000000000000','0x416476616e636564000000000000000000000000000000000000000000000000' ],'baseRate':1,'bountyDeadline':'336','bountyCurrency':'0x0000000000000000000000000000000000000000','bountyAllocator':'0x46bC737df7f1B3a7436F942813498CBE041a6ea4','expLvls':[{ 'mul':1,'name':'Beginner' },{ 'mul':3,'name':'Intermediate' },{ 'mul':5,'name':'Advanced' }] }
const DEFAULT_GITHUB = { 'status':'initial','token':null,'event':'' }

test('BountyAdded', async () => {
  const startingState = {
    'repos':[],
    'tokens':DEFAULT_TOKENS,
    'issues':[],
    'bountySettings': DEFAULT_BOUNTY_SETTINGS,
    'github': DEFAULT_GITHUB,
  }
  const action = {
    'logIndex':4,
    'transactionIndex':0,
    'transactionHash':'0xd14859b881d457e93154f47e9d51c680f7bd357aea51dcba661778f00baaa9d0',
    'blockHash':'0xda914bf68dffb1eb33796b540d1b510fd88ab53057079465f0c848c421eaf400',
    'blockNumber':111,
    'address':'0x5ec5DDf7A0cdD3235AD1bCC0ad04F059507EC5a3',
    'type':'mined',
    'id':'log_5f33355a',
    'returnValues':{ '0':'0x4d4445774f6c4a6c6347397a61585276636e6b784d6a59344f546b784e444d3d',
      '1':'1234',
      '2':'1000000000000000000',
      '3':'0',
      '4':'QmdnQVVo7rbY8YmKBPMiwktBQtghGabmQbzVFe8UrxyuTB',
      'repoId':'0x4d4445774f6c4a6c6347397a61585276636e6b784d6a59344f546b784e444d3d',
      'issueNumber':'1234',
      'bountySize':'1000000000000000000',
      'registryId':'0',
      'ipfsHash':'QmdnQVVo7rbY8YmKBPMiwktBQtghGabmQbzVFe8UrxyuTB' },
    'event':'BountyAdded',
    'signature':'0x3b14d766bf8aac539d952be8afbf82762890d5cda3ba03a94b31daac144fc865',
  }
  const endingState = {
    'repos':[],
    'tokens':DEFAULT_TOKENS,
    'issues':[{
      'issueNumber':'1234',
      'data':{
        'number':1234,
        'repoId':'MDEwOlJlcG9zaXRvcnkxMjY4OTkxNDM=',
        'assignee':'0x0000000000000000000000000000000000000000',
        'balance':'1000000000000000000',
        'hasBounty':true,
        'standardBountyId':'0',
        'deadline':'2019-10-01T20:49:08.753Z',
        'token':'0x0000000000000000000000000000000000000000',
        'workStatus':'funded',
        'detailsOpen':0,
        'exp':0,
        'fundingHistory':[{ 'user':{ 'id':'MDQ6VXNlcjIyMTYxNA==',
          'login':'chadoh',
          'url':'https://github.com/chadoh',
          'avatarUrl':'https://avatars1.githubusercontent.com/u/221614?v=4',
          '__typename':'User' },
        'date':'2019-10-01T20:48:59.485Z' }],
        'hours':1,
        'key':'MDU6SXNzdWU0OTI0Njc4MDY=',
        'repo':'open-enterprise',
        'size':1,
        'slots':1,
        'slotsIndex':0
      }
    }],
    'bountySettings': DEFAULT_BOUNTY_SETTINGS,
    'github': DEFAULT_GITHUB,
  }
  expect(await handleEvent(startingState, action)).toEqual(endingState)
})
