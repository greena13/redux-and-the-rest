import makeRequest from './helpers/makeRequest';

import warn from '../utils/dev/warn';
import isObject from '../utils/object/isObject';
import receiveCollection from './index/receiveCollection';
import handleCollectionError from './index/handleCollectionError';
import requestCollection from './index/requestCollection';
import requestResource from './show/requestResource';
import receiveResource from './show/receiveResource';
import handleResourceError from './show/handleResourceError';
import submitCreateResource from './create/submitCreateResource';
import receiveCreatedResource from './create/receiveCreatedResource';
import handleCreateResourceFailure from './create/handleCreateResourceError';
import submitUpdateResource from './update/submitUpdateResource';
import receiveUpdatedResource from './update/receiveUpdatedResource';
import handleUpdateResourceError from './update/handleUpdateResourceError';
import deleteResourceUpdate from './destroy/deleteResourceUpdate';
import removeResource from './destroy/removeResource';
import handleDestroyResourceError from './destroy/handleDestroyResourceError';
import camelCase from '../utils/string/camelCase';
import wrapInObject from '../utils/object/wrapInObject';
import resolveOptions from './helpers/resolveOptions';
import { EDITING, NEW } from '../constants/Statuses';
import { ITEM } from '../constants/DataStructures';
import projectionTransform from './helpers/transforms/projectionTransform';
import applyTransforms from '../reducers/helpers/applyTransforms';
import arrayFrom from '../utils/array/arrayFrom';
import generateUrl from './helpers/generateUrl';
import getItemKey from './helpers/getItemKey';
import getCollectionKey from './helpers/getCollectionKey';
import { getConfiguration } from '../configuration';
import RemoteOnlyActionsDictionary from '../constants/RemoteOnlyActionsDictionary';

/**
 * A function that can be called when a Redux action should be dispatched to perform an asynchronous action -
 * typically to make a request to an external API and wait for the response.
 * @typedef {function(*): Promise<unknown> | Promise<*>} Thunk
 */

/**
 * Redux action creator used for fetching a collection or resources from an index RESTful API endpoint
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} params A string or object that is serialized and used to fill in the dynamic parameters
 *        of the resource's URL
 * @param {Object} actionCreatorOptions={} The options passed to the action creator when it is called.
 * @returns {Thunk}
 */
function fetchCollection(options, params, actionCreatorOptions = { }) {
  const {
    action, url: urlTemplate, name, keyBy, urlOnlyParams, progress, projection
  } = options;

  const key = getCollectionKey(params, { urlOnlyParams });
  const url = generateUrl({ url: urlTemplate, name }, params);

  return (dispatch) => {
    /**
     * Immediately dispatch an action to change the state of the collection to be FETCHING
     */
    dispatch(requestCollection({ action, projection: actionCreatorOptions.projection || projection }, key));

    /**
     * Make a request to the external API and dispatch another action when the response is received, populating
     * the store with the contents of its body and changing the state to SUCCESS or ERROR, depending on the
     * result.
     */
    return makeRequest({
      ...options,
      key, keyBy, params,
      url,
      dispatch,
      credentials: true,
      onSuccess: receiveCollection,
      onError: handleCollectionError,
      progress
    }, actionCreatorOptions);
  };
}

/**
 * Redux action creator used for fetching a single resource item from a show RESTful API endpoint
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} params A string or object that is serialized and used to fill in the dynamic parameters
 *        of the resource's URL
 * @param {Object} actionCreatorOptions={} The options passed to the action creator when it is called.
 * @returns {Thunk}
 */
function fetchResource(options, params, actionCreatorOptions = { }) {
  const {
    action, transforms, url: urlTemplate, name, keyBy, progress, projection
  } = options;

  const key = getItemKey(params, { keyBy });
  const url = generateUrl({ url: urlTemplate, name }, params);

  return (dispatch) => {
    /**
     * Immediately dispatch an action to change the state of the resource item to be FETCHING
     */
    dispatch(requestResource({ action, transforms, key, projection  }, actionCreatorOptions));

    /**
     * Make a request to the external API and dispatch another action when the response is received, populating
     * the store with the contents of its body and changing the state to SUCCESS or ERROR, depending on the
     * result.
     */
    return makeRequest({
      ...options,
      key, keyBy, params,
      url,
      dispatch,
      credentials: true,
      onSuccess: receiveResource,
      onError: handleResourceError,
      progress
    }, actionCreatorOptions);
  };
}

function selectResource({ action, keyBy }, params, actionCreatorOptions = {}) {
  const key = getItemKey(params, { keyBy });

  return {
    type: action, key, value: actionCreatorOptions.value || true
  };
}

function selectAnotherResource({ action, keyBy }, params, actionCreatorOptions = {}) {
  const key = getItemKey(params, { keyBy });

  return {
    type: action, key, value: actionCreatorOptions.value || true
  };
}

function deselectResource({ action, keyBy }, params) {
  const key = getItemKey(params, { keyBy });

  return {
    type: action,
    key
  };
}

function clearSelectedCollection({ action }) {
  return { type: action };
}

function getCollectionKeys(collectionKeys, urlOnlyParams) {
  return arrayFrom(collectionKeys).map((collectionKey) => getCollectionKey(collectionKey, { urlOnlyParams }));
}

function extractCollectionOperations(actionCreatorOptions, urlOnlyParams) {
  const { push, unshift, invalidate } = actionCreatorOptions;

  return {
    push: getCollectionKeys(push, urlOnlyParams),
    unshift: getCollectionKeys(unshift, urlOnlyParams),
    invalidate: getCollectionKeys(invalidate, urlOnlyParams),
  };
}

function newResource(options, params, values = {}, actionCreatorOptions = {}) {
  const { action, transforms, keyBy, urlOnlyParams } = options;

  const temporaryKey = getItemKey(params, { keyBy });

  return {
    type: action,
    status: NEW,
    temporaryKey,
    collectionOperations: extractCollectionOperations(actionCreatorOptions, urlOnlyParams),
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      ...ITEM,
      values,
      status: { type: NEW },
    }),
  };
}

function clearNewResource({ action }) {
  return { type: action };
}

function editResource(options, params, values, actionCreatorOptions = {}) {
  const { action, transforms, keyBy } = options;

  const key = getItemKey(params, { keyBy });

  return {
    type: action,
    status: EDITING,
    key,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      ...ITEM,
      values,
      status: { type: EDITING }
    })
  };
}

function createResource(options, params, values, actionCreatorOptions = {}) {
  const {
    action,
    transforms,
    url: urlTemplate,
    urlOnlyParams,
    keyBy,
    progress,
    projection
  } = options;

  const key = getItemKey(params, { keyBy });
  const url = generateUrl({ url: urlTemplate, keyBy, ignoreOptionalParams: true }, wrapInObject(params, keyBy));

  return (dispatch) => {
    const collectionOperations = extractCollectionOperations(actionCreatorOptions, urlOnlyParams);

    dispatch(
      submitCreateResource({ action, transforms, key, projection }, actionCreatorOptions, values, collectionOperations)
    );

    return makeRequest({
      ...options,
      key, keyBy, params,
      collectionOperations,
      url,
      dispatch,
      credentials: true,
      request: {
        method: 'POST',
        body: JSON.stringify(values),
      },
      onSuccess: receiveCreatedResource,
      onError: handleCreateResourceFailure,
      progress
    }, actionCreatorOptions);
  };
}

function updateResource(options, params, values, actionCreatorOptions = {}) {
  const {
    action, transforms, url: urlTemplate, name, progress, keyBy, projection
  } = options;

  const key = getItemKey(params, { keyBy });
  const url = generateUrl({ url: urlTemplate, name }, wrapInObject(params, keyBy));

  return (dispatch) => {
    dispatch(
      submitUpdateResource(
        { transforms, action, key, projection },
        actionCreatorOptions,
        values,
        actionCreatorOptions
      )
    );

    return makeRequest({
      ...options,

      previousValues: actionCreatorOptions.previous,
      url,
      key, keyBy, params,
      dispatch,
      credentials: true,
      request: {
        method: 'PUT',
        body: JSON.stringify(values),
      },
      onSuccess: receiveUpdatedResource,
      onError: handleUpdateResourceError,
      progress
    }, actionCreatorOptions);
  };
}

function destroyResource(options, params, actionCreatorOptions = {}) {
  const {
    action,
    name,
    keyBy,
    url: urlTemplate,
    progress
  } = options;

  const key = getItemKey(params, { keyBy });
  const url = generateUrl({ url: urlTemplate, name }, wrapInObject(params, keyBy));

  return (dispatch) => {
    dispatch(deleteResourceUpdate({ action, key }, actionCreatorOptions));

    return makeRequest({
      ...options,

      url, key,
      previousValues: actionCreatorOptions.previous,
      dispatch,
      credentials: true,
      request: {
        method: 'delete',
      },
      onSuccess: removeResource,
      onError: handleDestroyResourceError,
      progress
    }, actionCreatorOptions);
  };
}

/**
 * Dictionary of standard action creators that perform a mix of synchronous and asynchronous changes where
 * updates need to be sent to a remote API to synchronise the local data state with the remote one.
 */
const STANDARD_ACTION_CREATORS = {
  index: fetchCollection,
  show: fetchResource,
  new: newResource,
  clearNew: clearNewResource,
  create: createResource,
  edit: editResource,
  update: updateResource,
  destroy: destroyResource,
  select: selectResource,
  selectAnother: selectAnotherResource,
  deselect: deselectResource,
  clearSelected: clearSelectedCollection
};

/**
 * Dictionary of action creators to use when then the localOnly option is set. These effectively cut out
 * requests to a remote RESTful API and instead perform the changes locally and synchronously.
 */
const LOCAL_ONLY_ACTION_CREATORS = {
  ...STANDARD_ACTION_CREATORS,
  create: (options, params, values, actionCreatorOptions = {}) => receiveCreatedResource({ ...options, params }, actionCreatorOptions, values),
  update: (options, params, values, actionCreatorOptions = {}) => receiveUpdatedResource({ ...options, params }, actionCreatorOptions, values),
  destroy: (options, key, values, actionCreatorOptions = {}) => removeResource({ ...options, key }, actionCreatorOptions, values),
};

/**
 * @typedef {string} ActionCreatorName The name of a function that dispatches an action
 */

/**
 * @typedef {Object.<string, any>} ActionObject An object representing an action being dispatched in the
 *          Redux store
 */

/**
 * @callback ActionThunk Performs an asynchronous action and calls dispatch when it is done with a new
 *           ActionObject
 * @param {Function} dispatch The Redux store's dispatch function
 */

/**
 * @callback ActionCreatorFunction Function that dispatches an ActionObject or an ActionThunk
 * @returns {ActionObject|ActionThunk}
 */

/**
 * @typedef {Object<ActionCreatorName, ActionCreatorFunction>} ActionCreatorDictionary A dictionary of
 *          ActionCreatorFunctions indexed by their ActionCreatorName
 */

/**
 * Builds a dictionary of ActionCreatorFunctions based in on resource and action options
 * @param {ResourceOptions} resourceOptions Resource options
 * @param {ActionsDictionary} actions Dictionary of actions
 * @param {ActionOptionsMap} actionsOptions Options for the action creators
 * @returns {ActionCreatorDictionary} The dictionary of all available ActionCreatorFunctions
 */
function buildActionCreators(resourceOptions, actions, actionsOptions) {
  const { name } = resourceOptions;

  const configuration = getConfiguration();
  const effectiveActionCreators = resourceOptions.localOnly ? LOCAL_ONLY_ACTION_CREATORS : STANDARD_ACTION_CREATORS;

  return Object.keys(actionsOptions).reduce((memo, key) => {

    /**
     * We don't export certain action creators when the localOnly option is used (as they don't make sense in
     * a local context).
     *
     * See RemoteOnlyActionsDictionary for a full list of actions that are excluded when the localOnly option is
     * used.
     */
    if (resourceOptions.localOnly && RemoteOnlyActionsDictionary[key]) {
      return memo;
    }
    const actionName = actions.get(key);

    /**
     * @type {{actionCreator}} actionOptions
     */
    const actionOptions = wrapInObject(actionsOptions[key]);

    const actionCreatorName = camelCase(actionName);
    const actionCreator = isObject(actionOptions) && actionOptions.actionCreator;

    const standardActionCreator = effectiveActionCreators[key];

    if (actionCreator) {

      memo[actionCreatorName] = actionCreator;

    } else if (standardActionCreator) {
      const _options = resolveOptions(
        {
          keyBy: 'id'
        },
        configuration,
        resourceOptions,
        actionOptions,
        [
          'url',
          'keyBy',
          'urlOnlyParams',
          'responseAdaptor',
          'progress',
          'requestErrorHandler',
          'request',
          'projection'
        ]
      );

      const actionCreatorConfig = {
        action: actions.get(key),
        transforms: [],
        name,
        urlOnlyParams: [],
        ..._options
      };

      actionCreatorConfig.transforms.push(projectionTransform);

      memo[actionCreatorName] = (arg1, arg2, arg3) => standardActionCreator(actionCreatorConfig, arg1, arg2, arg3);

    } else {
      warn(`'${key}' must match the collection of standard action creators (${Object.keys(STANDARD_ACTION_CREATORS).join(', ')}) or define an 'actionCreator' option. Check the options for ${name}`);
    }

    return memo;
  }, {});
}

export default buildActionCreators;
