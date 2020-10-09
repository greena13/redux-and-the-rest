import buildActions from './action-objects/buildActions';

import buildReducersDictionary from './reducers/buildReducersDictionary';
import buildActionCreators from './action-creators/buildActionCreators';
import objectFrom from './utils/object/objectFrom';
import getNewItem from './public-helpers/getNewItem';
import getList from './utils/getList';
import { getConfiguration } from './configuration';
import InitialResourceStateBuilder from './initialisation/InitialResourceStateBuilder';
import resolveOptions from './action-creators/helpers/resolveOptions';
import getItemWithEmptyFallback from './utils/getItem';
import getItemKey from './action-creators/helpers/getItemKey';
import getOrFetch from './utils/getOrFetch';
import getListKey from './action-creators/helpers/getListKey';
import warn from './utils/dev/warn';
import without from './utils/list/without';
import EmptyKey from './constants/EmptyKey';
import hasKey from './utils/object/hasKey';
import applyReducers from './reducers/helpers/applyReducers';
import ResourceRegistry from './utils/ResourceRegistry';
import { RESOURCES } from './constants/DataStructures';
import getOrInitializeNewItem from './utils/getOrInitializeNewItem';
import saveItem from './utils/saveItem';
import arrayFrom from './utils/array/arrayFrom';

/**
 * @typedef {Object<string, ResourcesDefinition>} AssociationOptionsMap A Mapping between the name of an
 *          associated resource, and its definition.
 */

/**
 * @typedef {{action: ActionType, reducer: ReducerFunction}} ActionReducerFunctionPair A mapping between an
 *         ActionType and the ReducerFunction that should be called when an action of that type is dispatched
 */

/**
 * @typedef {Object} ResourceOptions Options used to configure the resource and apply to all actions, unless
 *          overridden by more specific configuration in ActionOptions.
 * @property {string} [name] The pluralized name of the resource you are defining.
 * @property {string|Array.<String>} [keyBy] The resource attribute used to key/index all items of the current resource type.
 *           This will be the value you pass to each action creator to identify the target of each action. By
 *           default, 'id' is used.
 *
 * @property {boolean} [localOnly] Set to true for resources that should be edited locally, only. The fetch and
 *           fetchList actions are disabled (the fetch* action creators are not exported) and the createItem, updateItem
 *           and destroyItem only update the store locally, without making any HTTP requests.
 * @property {string} [url] A url template that is used for all of the resource's actions. The template string
 *           can include required url parameters by prefixing them with a colon (e.g. :id) and optional
 *           parameters are denoted by adding a question mark at the end (e.g. :id?). This will be used as the
 *           default url template, but individual actions may override it with their own.
 * @property {string[]} [urlOnlyParams] The attributes passed to action creators that should be used to create the request URL,
 *           but ignored when storing the request's response.
 * @property {ResponseAdaptorFunction} [responseAdaptor] Function used to adapt the response for a particular
 *           request before it is handed over to the reducers. The function must return the results as an object
 *           with properties: values and (optionally) error.
 * @property {Function} [requestAdaptor] Function used to adapt the JavaScript object before it is handed over to
 *           become the body of the request to be sent to an external API.
 * @property {RequestCredentials} [credentials] Whether to include, omit or send cookies that may be stored in
 *           the user agent's cookie jar with the request only if it's on the same origin.
 * @property {Object} [request] The request configuration object to be passed to the fetch method, or the
 *           new XMLHttpRequest object, when the progress option is used.
 *
 * @property {Array.<ReducerFunction>} [beforeReducers] A list of functions to call before passing the resource to
 *           the reducer. This is useful if you want to use the default reducer, but provide some additional
 *           pre-processing to standardise the resource before it is added to the store.
 * @property {Array.<ReducerFunction>} [afterReducers] A list of functions to call after passing the resource to
 *           the reducer. This is useful if you want to use the default reducer, but provide some additional
 *           post-processing to standardise the resource before it is added to the store.
 * @property {ActionReducerFunctionPair|Array.<ActionReducerFunctionPair>} [reducesOn] A single or list of objects
 *           with an action and a reducer, used to specify custom reducers in response to actions external to
 *           the current resource.
 * @property {ActionType|Array.<ActionType>} [clearOn] A single or list of actions for which the current resource
 *           should be cleared.
 * @property {string[] | AssociationOptions} [hasAndBelongsToMany] An object of associated resources, with a many-to-many
 *           relationship with the current one.
 * @property {string[] | AssociationOptions} [belongsTo] An object of associated resources, with a one-to-many relationship
 *           with the current one.
 */

/**
 * @typedef {Object} ActionOptions Options used to configure individual resource actions and override any
 *          options specified in GlobalOptions or ResourceOptions.
 * @property {string} url  A url template that is used for the action. The template string can include required
 *           url parameters by prefixing them with a colon (e.g. :id) and optional parameters are denoted by
 *           adding a question mark at the end (e.g. :id?).
 * @property {string} keyBy The resource attribute used to key/index all items of the current resource type.
 *           This will be the value you pass to each action creator to identify the target of each action. By
 *           default, 'id' is used.
 * @property {string[]} urlOnlyParams The attributes passed to the action's creator used to create the request
 *           URL, but ignored when storing the request's response.
 * @property {ReducerFunction} reducer A custom reducer function to adapt the resource as it exists in the
 *           Redux store. By default, the standard RESTful reducer is used for RESTful actions, but this
 *           attribute is required for Non-RESTful actions.
 * @property {boolean} progress Whether the store should emit progress events as the resource is uploaded or
 *           downloaded. This is applicable to the RESTful actions fetchList, fetchItem, createItem, updateItem and any
 *           custom actions.
 * @property {ResponseAdaptorFunction} responseAdaptor Function used to adapt the response for a particular
 *           request before it is handed over to the reducers. The function must return the results as an object
 *           with properties: values and (optionally) error.
 * @property {Function} requestAdaptor Function used to adapt the JavaScript object before it is handed over to
 *           become the body of the request to be sent to an external API.
 * @property {RequestCredentials} credentials Whether to include, omit or send cookies that may be stored in
 *           the user agent's cookie jar with the request only if it's on the same origin.
 * @property {Object} request The request configuration object to be passed to the fetch method, or the
 *           new XMLHttpRequest object, when the progress option is used.
 *
 * @property {Array.<ReducerFunction>} beforeReducers A list of functions to call before passing the resource to
 *           the reducer. This is useful if you want to use the default reducer, but provide some additional
 *           pre-processing to standardise the resource before it is added to the store.
 * @property {Array.<ReducerFunction>} afterReducers A list of functions to call after passing the resource to
 *           the reducer. This is useful if you want to use the default reducer, but provide some additional
 *           post-processing to standardise the resource before it is added to the store.
 */

/**
 * @typedef {Object<ActionType, ActionOptions|boolean>} ActionOptionsMap
 */


/**
 * @typedef {Object} ResourcesDefinition
 * @property {ActionDictionary} actions Mapping between RESTful action names and constant Redux Action names
 * @property {ActionCreatorDictionary} actionCreators Dictionary of available action creators
 * @property {ReducerFunction} reducers Reducer function that will accept the resource's current state and an
 *           action and return the new resource state
 * @property {function(ResourcesReduxState): ResourcesItem} getNewItem Function that returns the new item of
 *           this resource type
 * @property {function(ResourcesReduxState, Object|string): ResourcesItem} getItem Function that returns a
 *           particular item of a resource type
 * @property {function(string | ?Object, ?Object): ResourcesItem} getOrFetchItem Function that returns
 *           a particular item of a resource type, or calls the fetch action creator to retrieve it in the
 *           background.
 * @property {function(ResourcesReduxState, Object|string): ResourceListWithItems} getList Function that
 *          returns a particular list of resources
 * @property {function(string | ?Object, ?Object): ResourceListWithItems} getOrFetchList Function that
 *           returns a particular list of a resource type, or calls the fetch action creator to
 *           retrieve it in the background.
 * @property {function(Object[]): InitialResourceStateBuilder} buildInitialState Creates a new initial
 *           state builder for the resources of this type
 * @property {boolean} __isResourcesDefinition An internal flag to indicate an object is a resources definition
 */

/**
 * Defines a new resource, returning the actions, action creators, reducers and helpers to manage it
 * @param {ResourceOptions} resourceOptions Hash of options that configure how the resource is defined and
 *        behaves.
 * @param {ActionOptionsMap|string[]} actionOptions Hash of actions
 * @returns {ResourcesDefinition} The resources definition
 */
function resources(resourceOptions, actionOptions = {}) {
  const { name, singular, keyBy, localOnly } = resourceOptions;

  /**
   * Standardise the shape of the action options to support all forms:
   *  Array Syntax:
   *    ['fetchList', 'fetch']
   *
   *  Object syntax:
   *    { fetchList: true, fetch: true }
   *
   *  Extended object syntax:
   *    { fetchList: { keyBy: 'identifier' }, fetch: { keyBy: 'id' } }
   *
   * @type {ActionOptionsMap}
   */
  let _actionOptions = objectFrom(actionOptions, {});

  if (singular && _actionOptions.fetchList) {
    warn('resource does not support the fetchList action. Ignoring.');
    _actionOptions = without(actionOptions, 'fetchList');
  }

  const actions = buildActions(name, resourceOptions, Object.keys(_actionOptions));
  const reducersDictionary = buildReducersDictionary(resourceOptions, actions, _actionOptions);
  const actionCreators = buildActionCreators(resourceOptions, actions, _actionOptions);

  /**
   * Returns an item of a particular resource from a Redux store, removing any structure used implicitly.
   * If the item is not available in the store, an empty item is returned.
   * @param {ResourcesReduxState} resourcesState The current resource Redux store state
   * @param {Object|string} params The parameters used to calculate the index of the resource to return
   * @return {ResourcesItem} The resource item
   */
  function getItem(resourcesState, params = EmptyKey) {
    return getItemWithEmptyFallback(resourcesState, getItemKey(params, resourceOptions));
  }

  const resourceDefinition = {

    /**
     * @type {ActionDictionary} Mapping between RESTful action names and constant Redux Action names
     */
    actions,

    /**
     * @type {ActionCreatorDictionary} Dictionary of available action creators
     */
    actionCreators,

    /**
     * Reducer function that will accept the resource's current state and an action and return the new resource state
     * @param {ResourcesReduxState} currentState The current state of the part of the Redux store that contains
     *        the resources
     * @param {ActionObject} action The action containing the data to update the resource state
     * @returns {ResourcesReduxState} The new resource state
     */
    reducers: (currentState, action) => applyReducers(reducersDictionary, currentState || RESOURCES, action),

    /**
     * @type {function(ResourcesReduxState): ResourcesItem} Function that returns the new item of this resource
     *       type
     */
    getNewItem: singular ? getItem : getNewItem,

    getItem,

    getList,

    /**
     * Creates a new initial state builder for the resources of this type, which can be used to build an initial
     * state that is the correct format to work with its reducers and can be passed to the Redux store when it's
     * created.
     *
     * @param {Object|Object[]} [itemOrItems=[]] List of resource item values to be built into the initial resources state.
     * @returns {InitialResourceStateBuilder} Builder that can be used to create the resources' initial state.
     */
    buildInitialState(itemOrItems = []) {
      const options = resolveOptions(
        getConfiguration(),
        resourceOptions,
        ['keyBy']
      );

      return new InitialResourceStateBuilder(options, arrayFrom(itemOrItems));
    },

    /**
     * @type {boolean} An internal flag to indicate an object is a resources definition
     */
    __isResourcesDefinition: true
  };

  /**
   * Define dispatchers
   */
  Object.keys(actionCreators).forEach((key) => {
    const actionCreator = actionCreators[key];

    resourceDefinition[key] = (arg1, arg2, arg3) => {
      const { store } = getConfiguration();

      return store.dispatch(actionCreator(arg1, arg2, arg3));
    };
  });

  if (hasKey(actions, 'fetchItem')) {

    /**
     * Returns an item of a particular resource from a Redux store. If the item is not available in the store,
     * an empty item is returned immediately and the fetch action creator is called to update the store and
     * request the resource item from an external API.
     * @param {ResourcesReduxState} resourcesState The current resource Redux store state
     * @param {Object} [params={}] The params to serialize to use as the key to find the resource list.
     * @param {Object} [actionCreatorOptions={}] The options to pass to the fetch action creator if it's
     *        called.
     * @returns {ResourcesItem} The resource item if it's in the store, or an empty item.
     */
    resourceDefinition.getOrFetchItem = (resourcesState, params, actionCreatorOptions) => getOrFetch({
          typeKey: 'items',
          fallbackActionName: 'fetchItem',
          getFunction: getItem,
          fetchFunction: resourceDefinition.fetchItem,
          action: actions.fetchItem,
          localOnly,
          keyFunction: (_params) => getItemKey(_params, { keyBy: resourceOptions.keyBy, singular }),
        },
        resourcesState, params, actionCreatorOptions
      );
  }

  if (hasKey(actions, 'newItem')) {
    resourceDefinition.getOrInitializeNewItem = (resourcesState, paramsOrValues, valuesOrActionCreatorOptions, optionalActionCreatorOptions) => getOrInitializeNewItem({ action: actions.newItem, newItem: resourceDefinition.newItem }, resourcesState, paramsOrValues, valuesOrActionCreatorOptions, optionalActionCreatorOptions);
  }

  if (hasKey(actions, 'createItem') && hasKey(actions, 'updateItem')) {
    resourceDefinition.saveItem = (resourcesState, paramsOrValues, valuesOrActionCreatorOptions, optionalActionCreatorOptions) => saveItem({
        createItem: resourceDefinition.createItem,
        updateItem: resourceDefinition.updateItem,

        // Resource options required by handler
        keyBy, singular
      }, resourcesState, paramsOrValues, valuesOrActionCreatorOptions, optionalActionCreatorOptions);
  }

  if (hasKey(actions, 'fetchList')) {

    /**
     * Returns an list of a particular resource from a Redux store. If the list is not available in the store,
     * an empty list is returned immediately and the fetch action creator is called to update the store and
     * request the resource list from an external API.
     * @param {ResourcesReduxState} resourcesState The current resource Redux store state
     * @param {Object} [params={}] The params to serialize to use as the key to find the resource list.
     * @param {Object} [actionCreatorOptions={}] The options to pass to the fetch action creator if it's
     *        called.
     * @returns {ResourceListWithItems} The resource list if it's in the store, or an empty list.
     */
    resourceDefinition.getOrFetchList = (resourcesState, params, actionCreatorOptions) =>
      getOrFetch({
          typeKey: 'lists',
          getFunction: getList,
          fetchFunction: resourceDefinition.fetchList,
          action: actions.fetchList,
          localOnly,
          keyFunction: (_params) => getListKey(_params, { urlOnlyParams: resourceOptions.urlOnlyParams }),
        },
        resourcesState, params, actionCreatorOptions
      );
  }

  ResourceRegistry.getRegistry().addResource(resourceOptions, resourceDefinition, reducersDictionary);

  return resourceDefinition;
}


export default resources;
