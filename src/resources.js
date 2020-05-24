import ActionsDictionary from './action-objects/ActionsDictionary';

import buildReducers from './reducers/buildReducers';
import buildActionCreators from './action-creators/buildActionCreators';
import objectFrom from './utils/object/objectFrom';
import getNewItem from './public-helpers/getNewItem';
import getCollection from './utils/getCollection';
import { getConfiguration } from './configuration';
import InitialResourceStateBuilder from './initialisation/InitialResourceStateBuilder';
import DefaultConfigurationOptions from './constants/DefaultConfigurationOptions';
import resolveOptions from './action-creators/helpers/resolveOptions';
import getItemWithEmptyFallback from './utils/getItem';
import getItemKey from './action-creators/helpers/getItemKey';
import getOrFetch from './utils/getOrFetch';
import getCollectionKey from './action-creators/helpers/getCollectionKey';
import warn from './utils/dev/warn';
import without from './utils/collection/without';
import EmptyKey from './constants/EmptyKey';

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
 *           fetchCollection actions are disabled (the fetch* action creators are not exported) and the create, update
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
 * @property {AssociationOptions} [hasAndBelongsToMany] An object of associated resources, with a many-to-many
 *           relationship with the current one.
 * @property {AssociationOptions} [belongsTo] An object of associated resources, with a one-to-many relationship
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
 *           downloaded. This is applicable to the RESTful actions fetchCollection, fetch, create, update and any
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
 * @property {function(ResourcesReduxState, Object|string): ResourceCollectionWithItems} getCollection Function that
 *          returns a particular collection of resources
 * @property {function(string | ?Object, ?Object): ResourceCollectionWithItems} getOrFetchCollection Function that
 *           returns a particular collection of a resource type, or calls the fetch action creator to
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
  const { name, singular } = resourceOptions;

  /**
   * Standardise the shape of the action options to support all forms:
   *  Array Syntax:
   *    ['fetchCollection', 'fetch']
   *
   *  Object syntax:
   *    { fetchCollection: true, fetch: true }
   *
   *  Extended object syntax:
   *    { fetchCollection: { keyBy: 'identifier' }, fetch: { keyBy: 'id' } }
   *
   * @type {ActionOptionsMap}
   */
  let _actionOptions = objectFrom(actionOptions, {});

  if (singular && _actionOptions.fetchCollection) {
    warn('resource does not support the fetchCollection action. Ignoring.');
    _actionOptions = without(actionOptions, 'fetchCollection');
  }

  const actions = new ActionsDictionary(name, resourceOptions, Object.keys(_actionOptions));
  const reducers = buildReducers(resourceOptions, actions, _actionOptions);
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

  return {

    /**
     * @type {ActionDictionary} Mapping between RESTful action names and constant Redux Action names
     */
    actions: actions.toHash(),

    /**
     * @type {ActionCreatorDictionary} Dictionary of available action creators
     */
    actionCreators,

    /**
     * @type {ReducerFunction} Reducer function that will accept the resource's current state and an
     *       action and return the new resource state
     */
    reducers,

    /**
     * @type {function(ResourcesReduxState): ResourcesItem} Function that returns the new item of this resource
     *       type
     */
    getNewItem: singular ? getItem : getNewItem,

    getItem,

    /**
     * Returns an item of a particular resource from a Redux store. If the item is not available in the store,
     * an empty item is returned immediately and the fetch action creator is called to update the store and
     * request the resource item from an external API.
     * @param {ResourcesReduxState} resourcesState The current resource Redux store state
     * @param {Object} [params={}] The params to serialize to use as the key to find the resource collection.
     * @param {Object} [actionCreatorOptions={}] The options to pass to the fetch action creator if it's
     *        called.
     * @returns {ResourcesItem} The resource item if it's in the store, or an empty item.
     */
    getOrFetchItem(resourcesState, params, actionCreatorOptions) {
      return getOrFetch({
          typeKey: 'items',
          fallbackActionName: 'fetchItem',
          getFunction: getItem,
          fetchFunction: actionCreators.fetchItem,
          keyFunction: (_params) => getItemKey(_params, { keyBy: resourceOptions.keyBy, singular }),
        },
        resourcesState, params, actionCreatorOptions
      );
    },

    getCollection,

    /**
     * Returns an collection of a particular resource from a Redux store. If the collection is not available in the store,
     * an empty collection is returned immediately and the fetch action creator is called to update the store and
     * request the resource collection from an external API.
     * @param {ResourcesReduxState} resourcesState The current resource Redux store state
     * @param {Object} [params={}] The params to serialize to use as the key to find the resource collection.
     * @param {Object} [actionCreatorOptions={}] The options to pass to the fetch action creator if it's
     *        called.
     * @returns {ResourceCollectionWithItems} The resource collection if it's in the store, or an empty collection.
     */
    getOrFetchCollection(resourcesState, params, actionCreatorOptions) {
      return getOrFetch({
          typeKey: 'collections',
          getFunction: getCollection,
          fetchFunction: actionCreators.fetchCollection,
          keyFunction: (_params) => getCollectionKey(_params, { urlOnlyParams: resourceOptions.urlOnlyParams }),
        },
        resourcesState, params, actionCreatorOptions
      );
    },

    /**
     * Creates a new initial state builder for the resources of this type, which can be used to build an initial
     * state that is the correct format to work with its reducers and can be passed to the Redux store when it's
     * created.
     *
     * @param {Object[]} [items=[]] List of resource item values to be built into the initial resources state.
     * @returns {InitialResourceStateBuilder} Builder that can be used to create the resources' initial state.
     */
    buildInitialState(items = []) {
      const options = resolveOptions(
        DefaultConfigurationOptions,
        getConfiguration(),
        resourceOptions,
        ['keyBy']
      );

      return new InitialResourceStateBuilder(options, items);
    },

    /**
     * @type {boolean} An internal flag to indicate an object is a resources definition
     */
    __isResourcesDefinition: true
  };
}


export default resources;
