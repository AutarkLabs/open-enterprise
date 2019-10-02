function appStateReducer(state) {
  if(state){
    state.amountTokens = state.balances.map(token => { 
      return {amount: token.amount, symbol: token.symbol, address: token.address}
    })
  }
  return {
    ...state,
  }
}

export default appStateReducer
