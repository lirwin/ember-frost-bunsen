import _ from 'lodash'
import Ember from 'ember'
const {Logger} = Ember
import {CHANGE_VALUE, VALIDATION_RESOLVED, CHANGE_MODEL} from './actions'
import convertSchema from './convert-schema'

function ensureParent (stateValue, id) {
  // If id does not have a parent the nothing to do
  if (_.isEmpty(id) || id.indexOf('.') === -1) {
    return
  }

  const segments = id.split('.')
  const idLastSegment = segments.pop()
  const relativePath = segments.join('.')

  const relativeObject = _.get(stateValue, relativePath)
  const isArrayItem = /^\d+$/.test(idLastSegment)

  if (isArrayItem && !_.isArray(relativeObject)) {
    ensureParent(stateValue, segments.join('.'))
    _.set(stateValue, relativePath, [])
  } else if (!isArrayItem && !_.isPlainObject(relativeObject)) {
    ensureParent(stateValue, segments.join('.'))
    _.set(stateValue, relativePath, {})
  }
}

const INITIAL_VALUE = {
  errors: {},
  validationResult: {warnings: [], errors: []},
  value: null,
  model: {}, // Model calculated by the reducer
  baseModel: {} // Original model recieved
}
export function initialState (state) {
  return _.defaults(state, INITIAL_VALUE)
}

// TODO: Update lodash and get rid of this
function unset (obj, path) {
  _.set(obj, path, undefined)
  const obStr = JSON.stringify(obj)
  return JSON.parse(obStr)
}

/**
 * We want to go through a state.value object and pull out any references to null
 * @param {Object} value - our current value POJO
 * @returns {Object} a value cleaned of any `null`s
 */
function recursiveClean (value) {
  let output = {}
  if (_.isArray(value)) {
    output = []
  }
  _.each(value, (subValue, key) => {
    if (!_.isEmpty(subValue) || _.isNumber(subValue) || _.isBoolean(subValue)) {
      if (_.isObject(subValue) || _.isArray(subValue)) {
        output[key] = recursiveClean(subValue)
      } else {
        output[key] = subValue
      }
    }
  })
  return output
}

export default function (state, action) {
  switch (action.type) {
    case CHANGE_VALUE:
      const {value, bunsenId} = action
      let newValue

      if (bunsenId === null) {
        newValue = recursiveClean(value)
      } else {
        newValue = _.cloneDeep(state.value)
        if (_.contains([null, ''], value) || (_.isArray(value) && value.length === 0)) {
          newValue = unset(newValue, bunsenId)
        } else {
          ensureParent(newValue, bunsenId)
          _.set(newValue, bunsenId, value)
        }
      }
      const newModel = convertSchema(state.baseModel, newValue)
      let model
      if (!_.isEqual(state.model, newModel)) {
        model = newModel
      } else {
        model = state.model
      }

      return _.defaults({
        value: newValue,
        model
      }, state)

    case VALIDATION_RESOLVED:
      return _.defaults({
        validationResult: action.validationResult,
        errors: action.errors
      }, state)
    case CHANGE_MODEL:

      return _.defaults({
        baseModel: action.model,
        model: convertSchema(action.model, state.value)
      }, state)
    case '@@redux/INIT':
      if (state && state.baseModel) {
        state.model = convertSchema(state.baseModel, state.value || {})
      }
      return initialState(state || {})

    default:
      Logger.error(`Do not recognize action ${action.type}`)
  }
  return state
}
