import isObject from '../utils/object/isObject';
import warn from '../utils/dev/warn';
import arrayFrom from '../utils/array/arrayFrom';
import resolveOptions from '../action-creators/helpers/resolveOptions';
import progressReducer from './helpers/progressReducer';
import { getConfiguration } from '../configuration';
import fetchListAction from '../actions/RESTful/fetchList';
import fetchItemAction from '../actions/RESTful/fetchItem';
import newAction from '../actions/RESTful/newItem';
import clearNewItemAction from '../actions/RESTful/clearNewItem';
import editNewItemAction from '../actions/RESTful/editNewItem';
import createItemAction from '../actions/RESTful/createItem';
import editAction from '../actions/RESTful/editItem';
import editNewOrExistingItemAction from '../actions/RESTful/editNewOrExistingItem';
import clearItemEditAction from '../actions/RESTful/clearItemEdit';
import updateAction from '../actions/RESTful/updateItem';
import destroyItemAction from '../actions/RESTful/destroyItem';
import selectItemAction from '../actions/selection/selectItem';
import selectAnotherAction from '../actions/selection/selectAnotherItem';
import deselectAction from '../actions/selection/deselectItem';
import clearSelectedAction from '../actions/selection/clearSelectedItems';
import clearResourceAction from '../actions/clear/clearResource';
import clearItemAction from '../actions/clear/clearItem';
import clearListAction from '../actions/clear/clearList';

/**
 * Dictionary of standard reducer functions for keeping the local store synchronised with a remote RESTful API.
 */
const STANDARD_REDUCERS = {

  /**
   * RESTful actions
   */
  fetchList: fetchListAction.reducer,
  fetchItem: fetchItemAction.reducer,
  newItem: newAction.reducer,
  clearNewItem: clearNewItemAction.reducer,
  editNewItem: editNewItemAction.reducer,
  createItem: createItemAction.reducer,
  editItem: editAction.reducer,
  editNewOrExistingItem: editNewOrExistingItemAction.reducer,
  clearItemEdit: clearItemEditAction.reducer,
  updateItem: updateAction.reducer,
  destroyItem: destroyItemAction.reducer,

  /**
   * Clearing actions
   */
  clearResource: clearResourceAction.reducer,
  clearItem: clearItemAction.reducer,
  clearList: clearListAction.reducer,

  /**
   * Selection actions
   */
  selectItem: selectItemAction.reducer,
  selectAnotherItem: selectAnotherAction.reducer,
  deselectItem: deselectAction.reducer,
  clearSelectedItems: clearSelectedAction.reducer
};

/**
 * Dictionary of RESTful actions that have progress events
 * @type {Object<string, boolean>}
 */
const PROGRESS_COMPATIBLE_ACTIONS = {
  fetchList: true,
  fetchItem: true,
  updateItem: true,
  createItem: true
};

function getProgressReducer(key) {
  if (key === 'fetchList') {
    return (resources, action) => progressReducer(resources, action, 'lists');
  } else {
    return progressReducer;
  }
}

/**
 * Function that accepts the current state and Redux action and returns the correct new state.
 * @callback ReducerFunction
 * @param {ResourcesReduxState} currentState The current state of the part of the Redux store that contains
 *        the resources
 * @param {ActionObject} action The action containing the data to update the resource state
 * @returns {ResourcesReduxState} The new resource state
 */

/**
 * Creates the reducer function can be used to correctly update a resource's state after every Redux action that
 * is dispatched.
 * @param {ResourceOptions} resourceOptions Hash of actionsOptions for configuring the resource
 * @param {ActionDictionary} actionsDictionary Dictionary of actions available for the resource
 * @param {ActionOptionsMap} actionsOptions Hash of actionsOptions for configuring the actions that be dispatched to
 *        modify the resource
 * @returns {Object<string,ReducerFunction>} Reducer dictionary that will accept the resource's current state
 *        and an action and return the new resource state
 */
function buildReducersDictionary(resourceOptions, actionsDictionary, actionsOptions) {

  /**
   * Build the map of actions that should effect the current resource
   */
  const globalConfiguration = getConfiguration();

  /**
   * Iterate over the list of defined actions, creating the corresponding reducer and storing it in a map to
   * be retrieved and called each time the action occurs
   */
  const reducersDict = Object.keys(actionsOptions).reduce((memo, key) => {
    const actionOptions = actionsOptions[key];

    /**
     * Allow overriding the default reducer (or specifying a reducer for a custom action) otherwise default
     * to the standard reducer
     */
    const reducer = (isObject(actionOptions) && actionOptions.reducer) || STANDARD_REDUCERS[key];

    if (reducer) {

      /**
       * Construct the correct reducer options, merging those specified (in order of precedence):
       * - In the individual action definitions passed to the resource function ("Action options")
       * - Using the general options passed to the resources function ("Resource options"
       * - Using the configure function ("Global options")
       *
       * These options can still be overridden by options passed to the action creator each time it's called
       */
      const reducerOptions = resolveOptions(

        /**
         * List of objects to source options from
         */
        globalConfiguration, resourceOptions, actionOptions,

        /**
         * List of options to pluck
         */
        ['progress', 'beforeReducers', 'afterReducers']
      );

      /**
       * Set up the additional transform functions required to process progress updates if the progress
       * actions have been enabled.
       */
      if (reducerOptions.progress && (!STANDARD_REDUCERS[key] || PROGRESS_COMPATIBLE_ACTIONS[key])) {
        reducerOptions.beforeReducers = [
          ...reducerOptions.beforeReducers,
          getProgressReducer(key)
        ];
      }

      const _reducer = function () {

        /**
         * If there are additional transform functions to be run before or after the primary reducer
         * enqueue them to run in sequence, passing the result of each to the next
         */

        if (reducerOptions.beforeReducers.length > 0 || reducerOptions.afterReducers.length > 0) {
          return (resources, action) => {
            let _resources = resources;

            reducerOptions.beforeReducers.forEach((beforeReducer) => {
              _resources = beforeReducer(_resources, action);
            });

            _resources = reducer(_resources, action);

            reducerOptions.afterReducers.forEach((afterReducer) => {
              _resources = afterReducer(_resources, action);
            });

            return _resources;
          };
        } else {
          return reducer;
        }
      }();

      memo[actionsDictionary[key]] = {
        options: reducerOptions,
        reducer: _reducer
      };
    } else {
      if (resourceOptions.localOnly && STANDARD_REDUCERS[key]) {
        warn(`Action '${key}' is not compatible with the localOnly option.`);
      } else {
        const standardReducersList = Object.keys(STANDARD_REDUCERS).join(', ');

        warn(`Action '${key}' must match the list of standard reducers (${standardReducersList}) or define a 'reducer' option.`);
      }
    }

    return memo;
  }, {});

  /**
   * Add actions for which the current resource should be cleared
   */
  arrayFrom(resourceOptions.clearOn).forEach((action) => {
    reducersDict[action] = { reducer: STANDARD_REDUCERS.clearResource };
  });

  /**
   * Add actions for which the current resource should call a reducer function
   */
  arrayFrom(resourceOptions.reducesOn).forEach(({ action, reducer }) => {
    reducersDict[action] = { reducer };
  });

  return reducersDict;
}

export default buildReducersDictionary;
