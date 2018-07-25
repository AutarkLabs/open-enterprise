import issuecuration from './templates/issuecuration'
import budgetengine from './templates/budgetengine'
import allocations from './templates/allocations'

const IssueCuration = Symbol('IssueCuration')
const BudgetEngine = Symbol('BudgetEngine')
const Allocations = Symbol('Allocations')

const Templates = new Map()
Templates.set(Allocations, allocations)
Templates.set(BudgetEngine, budgetengine)
Templates.set(IssueCuration, issuecuration)

export default Templates
export { IssueCuration, BudgetEngine, Allocations }

