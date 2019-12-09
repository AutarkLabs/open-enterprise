// from https://github.com/ReactTraining/history/blob/3f69f9e07b0a739419704cffc3b3563133281548/modules/PathUtils.js#L48
function createPath(location) {
  const { pathname, search, hash } = location

  let path = pathname || '/'

  if (search && search !== '?')
    path += search.charAt(0) === '?' ? search : `?${search}`

  if (hash && hash !== '#') path += hash.charAt(0) === '#' ? hash : `#${hash}`

  return path
}

// from https://github.com/ReactTraining/history/blob/3f69f9e07b0a739419704cffc3b3563133281548/modules/PathUtils.js#L24
function parsePath(path) {
  let pathname = path || '/'
  let search = ''
  let hash = ''

  const hashIndex = pathname.indexOf('#')
  if (hashIndex !== -1) {
    hash = pathname.substr(hashIndex)
    pathname = pathname.substr(0, hashIndex)
  }

  const searchIndex = pathname.indexOf('?')
  if (searchIndex !== -1) {
    search = pathname.substr(searchIndex)
    pathname = pathname.substr(0, searchIndex)
  }

  return {
    pathname,
    search: search === '?' ? '' : search,
    hash: hash === '#' ? '' : hash
  }
}

class AragonHistory {
  constructor(path, requestPath) {
    this.path = path
    this.requestPath = requestPath
    this.location = {
      ...parsePath(path),

      // do we want to support these?
      // key: 'randomString',
      // state: undefined,
    }
    this.createHref = this.createHref.bind(this)
    this.listeners = []
    this.appendListener = this.appendListener.bind(this)
    this.listen = this.listen.bind(this)
    this.notifyListeners = this.notifyListeners.bind(this)
    this.go = this.go.bind(this)
    this.push = this.push.bind(this)
    this.replace = this.replace.bind(this)
    this.setRequestPath = this.setRequestPath.bind(this)
  }
  appendListener(fn) {
    function listener(...args) {
      fn(...args)
    }
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(item => item !== listener)
    }
  }
  createHref(val) {
    return createPath(val)
  }
  listen(fn) {
    return this.appendListener(fn)
  }
  notifyListeners(...args) {
    this.listeners.forEach(listener => listener(...args))
  }
  go(val) {
    if (typeof val === 'object') {
      this.requestPath && this.requestPath(val.pathname + val.search + val.hash)
      this.location = val
    } else {
      this.requestPath && this.requestPath(val)
      this.location = parsePath(val)
    }
    const action = {} // need to pass action to notifyListeners for it to behave properly; not sure if it needs to have a real value
    this.notifyListeners(this.location, action)
  }
  push(val) {
    this.go(val)
  }
  // requestPath does not support replace
  replace(val) {
    this.go(val)
  }
  setRequestPath(newRequestPath) {
    this.requestPath = newRequestPath
  }
}

export default ({ path, requestPath }) => {
  return new AragonHistory(path, requestPath)
}
