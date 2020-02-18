import ActionsDictionary from './action-objects/ActionsDictionary';

import buildReducers from './reducers/buildReducers';
import buildActionCreators from './action-creators/buildActionCreators';
import objectFrom from './utils/object/objectFrom';
import getItem from './utils/getItem';
import getNewItem from './utils/getNewItem';
import getCollection from './utils/getCollection';

/**
 * @callback GetItemFunction Returns an item of a particular resource from a Redux store, removing any
 *          structure used implicitly.
 * @param {ResourcesReduxState} resource The current resource Redux store state
 * @param {Object|string} params The parameters used to calculate the index of the resource to return
 * @return {ResourceItem} The resource item
 *
 */

/**
 * @callback GetCollectionFunction Returns a collection of a particular resource from a Redux store, populating
 *           it with the correct items, in the right order.
 * @param {ResourcesReduxState} resource The current resource Redux store state
 * @param {Object|string} params The parameters used to calculate the index of the collection to return
 * @return {ResourceCollectionWithItems} The resource collection
 *
 */

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
 * @property {string} name The pluralized name of the resource you are defining.
 * @property {string} [keyBy] The resource attribute used to key/index all items of the current resource type.
 *           This will be the value you pass to each action creator to identify the target of each action. By
 *           default, 'id' is used.
 *
 * @property {boolean} [localOnly] Set to true for resources that should be edited locally, only. The show and
 *           index actions are disabled (the fetch* action creators are not exported) and the create, update
 *           and destroy only update the store locally, without making any HTTP requests.
 * @property {string} [url] A url template that is used for all of the resource's actions. The template string
 *           can include required url parameters by prefixing them with a colon (e.g. :id) and optional
 *           parameters are denoted by adding a question mark at the end (e.g. :id?). This will be used as the
 *           default url template, but individual actions may override it with their own.
 * @property {string[]} [urlOnlyParams] The attributes passed to action creators that should be used to create the request URL,
 *           but ignored when storing the request's response.
 * @property {ResponseAdaptorFunction} responseAdaptor Function used to adapt the response for a particular
 *           request before it is handed over to the reducers. The function must return the results as an object
 *           with properties: values and (optionally) error.
 * @property {Function} requestAdaptor Function used to adapt the JavaScript object before it is handed over to
 *           become the body of the request to be sent to an external API.
 * @property {boolean} credentials=false Whether to include any cookies with the request that may be stored in
 *           the user agent's cookie jar for the request's domain.
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
 *           downloaded. This is applicable to the RESTful actions index, show, create, update and any
 *           custom actions.
 * @property {ResponseAdaptorFunction} responseAdaptor Function used to adapt the response for a particular
 *           request before it is handed over to the reducers. The function must return the results as an object
 *           with properties: values and (optionally) error.
 * @property {Function} requestAdaptor Function used to adapt the JavaScript object before it is handed over to
 *           become the body of the request to be sent to an external API.
 * @property {boolean} credentials=false Whether to include any cookies with the request that may be stored in
 *           the user agent's cookie jar for the request's domain.
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
 *          action and return the new resource state
 * @property {function(ResourcesReduxState): ResourceItem} getNewItem Function that returns the new item in the
 *           collection
 * @property {GetItemFunction} getItem Function that returns a particular item of a resource type
 * @property {GetCollectionFunction} getCollection Function that returns a particular collection of resources
 */

/**
 * Defines a new resource, returning the actions, action creators, reducers and helpers to manage it
 * @param {ResourceOptions} resourceOptions Hash of options that configure how the resource is defined and
 *        behaves.
 * @param {ActionOptionsMap|string[]} actionOptions Hash of actions
 * @returns {ResourcesDefinition} The resources definition
 */
function resources(resourceOptions, actionOptions = {}) {
  const { name } = resourceOptions;

  /**
   * Standardise the shape of the action options to support all forms:
   *  Array Syntax:
   *    ['index', 'show']
   *
   *  Object syntax:
   *    { index: true, show: true }
   *
   *  Extended object syntax:
   *    { index: { keyBy: 'identifier' }, show: { keyBy: 'id' } }
   *
   * @type {ActionOptionsMap}
   */
  const _actionOptions = objectFrom(actionOptions, {});

  const actions = new ActionsDictionary(name, resourceOptions, Object.keys(_actionOptions));
  const reducers = buildReducers(resourceOptions, actions, _actionOptions);
  const actionCreators = buildActionCreators(resourceOptions, actions, _actionOptions);

  return {
    actions: actions.toHash(),
    actionCreators,
    reducers,

    getItem: (resource, params) => getItem(resourceOptions, resource, params),

    getNewItem,

    getCollection: (resource, params) => getCollection(resourceOptions, resource, params),

    __isResource: true
  };
}


export default resources;
