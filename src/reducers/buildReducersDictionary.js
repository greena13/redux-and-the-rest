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
import isFunction from '../utils/object/isFunction';
import mergeItemStatus from '../public-reducers/mergeItemStatus';
import mergeItemValues from '../public-reducers/mergeItemValues';
import mergeListStatus from '../public-reducers/mergeListStatus';
import replaceListPositions from '../public-reducers/replaceListPositions';
import replaceListMetadata from '../public-reducers/replaceListMetadata';
import replaceItemMetadata from '../public-reducers/replaceItemMetadata';
import mergeItemMetadata from '../public-reducers/mergeItemMetadata';
import mergeListMetadata from '../public-reducers/mergeListMetadata';
import clearItem from '../public-reducers/clearItem';
import clearList from '../public-reducers/clearList';
import clearResources from '../public-reducers/clearResources';
import replaceItemValues from '../public-reducers/replaceItemValues';
import getItemStatus from '../public-reducers/getItemStatus';
import getItemValues from '../public-reducers/getItemValues';
import getItemMetadata from '../public-reducers/getItemMetadata';
import getListStatus from '../public-reducers/getListStatus';
import getListPositions from '../public-reducers/getListPositions';
import getListMetadata from '../public-reducers/getListMetadata';
import isString from '../utils/string/isString';
import removeItemFromListPositions from '../public-reducers/removeItemFromListPositions';

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

  const reducerHelpers = {

    /**
     * Returns the status of an item by providing its params
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} params The parameters to serialize to generate the item's key
     * @returns {ResourceStatus} The item's status object
     */
    getItemStatus: (state, params) => getItemStatus(resourceOptions, state, params),

    /**
     * Returns a copy of current resource's redux state with an item's status merged with new values
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} params The parameters to serialize to generate the item's key
     * @param {Object} newStatus An object of values to merge into the item's current status object
     * @returns {ResourcesReduxState} The resource's redux state with the item's new status values
     */
    mergeItemStatus: (state, params, newStatus) => mergeItemStatus(resourceOptions, state, params, newStatus),

    /**
     * Returns the values of an item by providing its params
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} params The parameters to serialize to generate the item's key
     * @returns {ResourceStatus} The item's values object
     */
    getItemValues: (state, params) => getItemValues(resourceOptions, state, params),

    /**
     * Returns a copy of current resource's redux state with an item's values merged with new values
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} params The parameters to serialize to generate the item's key
     * @param {Object} newValues An object of values to merge into the item's current values object
     * @returns {ResourcesReduxState} The resource's redux state with the item's new values
     */
    mergeItemValues: (state, params, newValues) => mergeItemValues(resourceOptions, state, params, newValues),

    /**
     * Returns a copy of current resource's redux state with an item's values replaced by new values
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} params The parameters to serialize to generate the item's key
     * @param {Object} values An object of values to replace the item's current values object
     * @returns {ResourcesReduxState} The resource's redux state with the item's new values
     */
    replaceItemValues: (state, params, values) => replaceItemValues(resourceOptions, state, params, values),

    /**
     * Returns a copy of current resource's redux state with an item's values cleared
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} params The parameters to serialize to generate the item's key
     * @returns {ResourcesReduxState} The resource's redux state with the item's new values
     */
    clearItemValues: (state, params) => replaceItemValues(resourceOptions, state, params, {}),

    /**
     * Returns a copy of current resource's redux state with an item omitted
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} params The parameters to serialize to generate the item's key
     * @returns {ResourcesReduxState} The resource's redux state with the item's new values
     */
    clearItem: (state, params) => clearItem(resourceOptions, state, params),

    /**
     * Returns the metadata of an item by providing its params
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} params The parameters to serialize to generate the item's key
     * @returns {Metadata} The item's metadata object
     */
    getItemMetadata: (state, params) => getItemMetadata(resourceOptions, state, params),

    /**
     * Returns a copy of current resource's redux state with an item's metadata merged with new metadata
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} params The parameters to serialize to generate the item's key
     * @param {Object} metadata An object of metadata to merge into the item's current metadata object
     * @returns {ResourcesReduxState} The resource's redux state with the item's new metadata
     */
    mergeItemMetadata: (state, params, metadata) => mergeItemMetadata(resourceOptions, state, params, metadata),

    /**
     * Returns a copy of current resource's redux state with an item's metadata replaced by new metadata
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} params The parameters to serialize to generate the item's key
     * @param {Object} metadata An object of metadata to replace item's current metadata object
     * @returns {ResourcesReduxState} The resource's redux state with the item's new metadata
     */
    replaceItemMetadata: (state, params, metadata) => replaceItemMetadata(resourceOptions, state, params, metadata),

    /**
     * Returns a copy of current resource's redux state with an item's metadata cleared
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} params The parameters to serialize to generate the item's key
     * @returns {ResourcesReduxState} The resource's redux state with the item's new metadata
     */
    clearItemMetadata: (state, params) => replaceItemMetadata(resourceOptions, state, params, {}),

    /**
     * Returns the status of an list by providing its params
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} params The parameters to serialize to generate the list's key
     * @returns {ResourceStatus} The list's status object
     */
    getListStatus: (state, params) => getListStatus(resourceOptions, state, params),

    /**
     * Returns a copy of current resource's redux state with an list's status merged with new values
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} params The parameters to serialize to generate the list's key
     * @param {Object} newStatus An object of values to merge into the list's current status object
     * @returns {ResourcesReduxState} The resource's redux state with the list's new status values
     */
    mergeListStatus: (state, params, newStatus) => mergeListStatus(resourceOptions, state, params, newStatus),

    /**
     * Returns the positions of an list by providing its params
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} params The parameters to serialize to generate the list's key
     * @returns {Array<ItemOrListParameters>} The list's positions array
     */
    getListPositions: (state, params) => getListPositions(resourceOptions, state, params),

    /**
     * Returns a copy of current resource's redux state with item's key removed from the list specified
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} listParams The parameters to serialize to generate the list's key
     * @param {ItemOrListParameters} itemParams The parameters to serialize to generate the item's key
     * @returns {ResourcesReduxState} The resource's redux state with the item removed from the list
     */
    removeItemFromListPositions: (state, listParams, itemParams) => removeItemFromListPositions(resourceOptions, state, listParams, itemParams),

    /**
     * Returns a copy of current resource's redux state with an list's positions replaced by new positions
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} params The parameters to serialize to generate the list's key
     * @param {Object} positions An object of positions to replace the list's current positions object
     * @returns {ResourcesReduxState} The resource's redux state with the list's new positions
     */
    replaceListPositions: (state, params, positions) => replaceListPositions(resourceOptions, state, params, positions),

    /**
     * Returns the metadata of an list by providing its params
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} params The parameters to serialize to generate the list's key
     * @returns {Metadata} The list's metadata object
     */
    getListMetadata: (state, params) => getListMetadata(resourceOptions, state, params),

    /**
     * Returns a copy of current resource's redux state with a list's metadata merged with new metadata
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} params The parameters to serialize to generate the list's key
     * @param {Object} metadata An object of metadata to merge into the list's current metadata object
     * @returns {ResourcesReduxState} The resource's redux state with the list's new metadata
     */
    mergeListMetadata: (state, params, metadata) => mergeListMetadata(resourceOptions, state, params, metadata),

    /**
     * Returns a copy of current resource's redux state with a list's metadata replaced by new metadata
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} params The parameters to serialize to generate the list's key
     * @param {Object} metadata An object of metadata to replace list's current metadata object
     * @returns {ResourcesReduxState} The resource's redux state with the list's new metadata
     */
    replaceListMetadata: (state, params, metadata) => replaceListMetadata(resourceOptions, state, params, metadata),

    /**
     * Returns a copy of current resource's redux state with a list's metadata cleared
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} params The parameters to serialize to generate the list's key
     * @returns {ResourcesReduxState} The resource's redux state with the list's new metadata
     */
    clearListMetadata: (state, params) => replaceListMetadata(resourceOptions, state, params, {}),

    /**
     * Returns a copy of current resource's redux state with a list omitted
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} params The parameters to serialize to generate the list's key
     * @returns {ResourcesReduxState} The resource's redux state with the list's new values
     */
    clearList: (state, params) => clearList(resourceOptions, state, params),

    /**
     * Returns a copy of current resource's redux state an item no longer selected
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} params The parameters to serialize to generate the key of the item to deselect
     * @returns {ResourcesReduxState} The resource's redux state with the item no longer selected
     */
    deselectItem: (state, params) => deselectAction.reducer(
        state,
        deselectAction.actionCreator(resourceOptions, params)
      ),

    /**
     * Returns a copy of current resource's redux state with an item added to those already selected
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} params The parameters to serialize to generate the key of the item to select
     * @returns {ResourcesReduxState} The resource's redux state with the item selected
     */
    selectAnotherItem: (state, params) => selectAnotherAction.reducer(
        state,
        selectAnotherAction.actionCreator(resourceOptions, params)
      ),

    /**
     * Returns a copy of current resource's redux state with only the specified item selected
     * @param {ResourcesReduxState} state The current resource redux state
     * @param {ItemOrListParameters} params The parameters to serialize to generate the key of the item to select
     * @returns {ResourcesReduxState} The resource's redux state with the item selected
     */
    selectItem: (state, params) => selectItemAction.reducer(
        state,
        selectItemAction.actionCreator(resourceOptions, params)
      ),

    /**
     * Returns a copy of current resource's redux state no items selected
     * @returns {ResourcesReduxState} The resource's redux state with the selection cleared
     */
    clearSelectedItems: clearSelectedAction.reducer,

    /**
     * Returns an empty singular resource state, for clearing the entire resource
     * @returns {ResourcesReduxState} An empty resource state
     */
    clearResource: clearResources,
  };

  reducerHelpers.deselectItems = reducerHelpers.deselectItem;
  reducerHelpers.selectItems = reducerHelpers.selectItem;
  reducerHelpers.selectMoreItems = reducerHelpers.selectAnotherItem;
  reducerHelpers.clearResources = reducerHelpers.clearResource;

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
    const reducer = function(){
      if (isObject(actionOptions)) {
        const { reducer: customReducer } = actionOptions;

        if (isFunction(customReducer)) {
          return (resources, action) => customReducer(resources, action, reducerHelpers);
        } else if (isString(customReducer)) {
          return STANDARD_REDUCERS[customReducer];
        }
      }

      return STANDARD_REDUCERS[key];
    }();

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
      const beforeReducers = arrayFrom(reducerOptions.beforeReducers);

      if (reducerOptions.progress && (!STANDARD_REDUCERS[key] || PROGRESS_COMPATIBLE_ACTIONS[key])) {
        reducerOptions.beforeReducers = [
          ...beforeReducers,
          getProgressReducer(key)
        ];
      }

      const _reducer = function () {

        /**
         * If there are additional transform functions to be run before or after the primary reducer
         * enqueue them to run in sequence, passing the result of each to the next
         */

        const afterReducers = arrayFrom(reducerOptions.afterReducers);

        if (beforeReducers.length > 0 || afterReducers.length > 0) {
          return (resources, action) => {
            let _resources = resources;

            beforeReducers.forEach((beforeReducer) => {
              _resources = beforeReducer(_resources, action, reducerHelpers);
            });

            _resources = reducer(_resources, action, reducerHelpers);

            afterReducers.forEach((afterReducer) => {
              _resources = afterReducer(_resources, action, reducerHelpers);
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
  Object.keys(resourceOptions.reducesOn || {}).forEach((actionName) => {
    const reducer = resourceOptions.reducesOn[actionName];

    if (actionsDictionary[actionName]) {

      /**
       * Support using an actions alias, (e.g. 'editItem') rather than the action's full type (e.g 'EDIT_USER')
       *
       * In this case, we need to wrap the existing reducer and call it first, to ensure it doesn't get
       * skipped. This is effectively equivalent to defining an afterReducers option for the action.
       */

      const existingReducerKey = actionsDictionary[actionName];
      const existingReducer = reducersDict[existingReducerKey];

      reducersDict[existingReducerKey] = {
        reducer: (resources, action) => reducer(existingReducer.reducer(resources, action), action, reducerHelpers)
      };
    } else {
      reducersDict[actionName] = {
        reducer: (resources, action) => reducer(resources, action, reducerHelpers)
      };
    }

  });

  return reducersDict;
}

export default buildReducersDictionary;
