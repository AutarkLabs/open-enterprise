import issuecuration from './templates/issuecuration'
import budgetengine from './templates/budgetengine'
import payoutengine from './templates/payoutengine'

const IssueCuration = Symbol('IssueCuration')
const BudgetEngine = Symbol('BudgetEngine')
const PayoutEngine = Symbol('PayoutEngine')

const Templates = new Map()
Templates.set(PayoutEngine, payoutengine)
Templates.set(BudgetEngine, budgetengine)
Templates.set(IssueCuration, issuecuration)

export default Templates
export { IssueCuration, BudgetEngine, PayoutEngine }

