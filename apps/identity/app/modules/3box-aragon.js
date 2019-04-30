import Box from '3box'

const supportedJsonRPCMethods = new Set(['personal_sign'])
const supportedJsonRPCVersions = new Set(['2.0'])

const supportedMethod = (method, jsonRPCVersion) => {
  return (
    supportedJsonRPCVersions.has(jsonRPCVersion) &&
    supportedJsonRPCMethods.has(method)
  )
}

class BoxAragonBridge {
  constructor(ethereumAddress, requestSignMessage) {
    this.ethereumAddress = ethereumAddress
    this.requestSignMessage = requestSignMessage
  }

  getMethod = method => {
    const methods = {
      personal_sign: async ([message], callback) => {
        this.requestSignMessage(message).subscribe(
          signature => callback(null, { result: signature, error: null }),
          error => callback(error, { error })
        )
      },
    }

    return methods[method]
  }

  sendAsync = async ({ fromAddress, method, params, jsonrpc }, callback) => {
    if (!supportedMethod(method, jsonrpc)) {
      throw new Error('Unsupported sendAsync json rpc method or version')
    }

    if (fromAddress.toLowerCase() !== this.ethereumAddress.toLowerCase()) {
      throw new Error('Address mismatch')
    }

    const handler = this.getMethod(method)
    handler(params, callback)
  }
}

export class Profile {
  constructor(ethereumAddress, aragonApi) {
    this.ethereumAddress = ethereumAddress
    this.boxAragonBridge = new BoxAragonBridge(
      ethereumAddress,
      aragonApi.requestSignMessage.bind(aragonApi)
    )
    this.boxState = {
      opened: false,
      errorFetchingBox: false,
    }
    this.unlockedBox = null
  }

  getPublic = () => Box.getProfile(this.ethereumAddress)

  unlock = () =>
    new Promise(async (resolve, reject) => {
      const openedBox = await Box.openBox(
        this.ethereumAddress,
        this.boxAragonBridge
      )

      this.boxState = { opened: true, synced: false }
      this.unlockedBox = openedBox

      openedBox.onSyncDone(async () => {
        try {
          this.boxState = { opened: true, synced: true }
          resolve()
        } catch (err) {
          this.boxState = { opened: false, synced: false }
          reject(err)
        }
      })
    })

  isLoggedIn = () => Box.isLoggedIn(this.ethereumAddress)

  getPrivate = () => {
    if (this.boxState.opened && this.boxState.synced) {
      return this.unlockedBox.private.all()
    }

    throw new Error('box was not unlocked or has not finished syncing')
  }

  checkForErrorsBeforeSetting = (fields, values) => {
    if (!this.boxState.opened || !this.boxState.synced) {
      throw new Error('box was not unlocked or has not finished syncing')
    }
    if (!Array.isArray(fields) || !Array.isArray(values)) {
      throw new Error('must pass two arrays')
    }
  }

  setPublicFields = async (fields, values) => {
    this.checkForErrorsBeforeSetting(fields, values)
    try {
      await this.unlockedBox.public.setMultiple(fields, values)
    } catch (err) {
      throw new Error(`Error setting in box: ${err}`)
    }
  }

  setPrivateFields = async (fields, values) => {
    this.checkForErrorsBeforeSetting(fields, values)
    try {
      await this.unlockedBox.private.setMultiple(fields, values)
    } catch (err) {
      throw new Error(`Error setting in box: ${err}`)
    }
  }
}
