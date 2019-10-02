function appStateReducer(state) {
  if(state){
    state.amountTokens = state.balances.map(token => { 
      return {amount: token.amount, symbol: token.symbol, address: token.address, decimals: token.decimals}
    })
  }
  return {
    ...state,
  }
}

export default appStateReducer
