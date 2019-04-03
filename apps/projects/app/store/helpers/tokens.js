import { app } from '../app'
import tokenSymbolAbi from '../../abi/token-symbol.json'
import tokenDecimalsAbi from '../../abi/token-decimal.json'

const tokenAbi = [].concat(tokenDecimalsAbi, tokenSymbolAbi)

function loadToken(token) {
  let tokenContract = app.external(token, tokenAbi)
  return new Promise(resolve => {
    tokenContract.symbol().subscribe(symbol => {
      tokenContract.decimals().subscribe(decimals => {
        resolve({
          addr: token,
          symbol: symbol,
          decimals: decimals,
        })
      })
    })
  })
}

export const syncTokens = async (state, { token }) => {
  try {
    const tokens = state.tokens
    let tokenIndex = tokens.findIndex(currentToken => currentToken.addr === token)
    if(tokenIndex == -1) {
      let newToken = await loadToken(token)
      tokenIndex = tokens.findIndex(currentToken => currentToken.symbol === newToken.symbol)
      if(tokenIndex !== -1){
        tokens[tokenIndex] = newToken
      } else {
        tokens.push(newToken)
      }
    }
    return state
  } catch (err) {
    console.error('[Projects script] syncSettings settings failed:', err)
    return state
  }
}
