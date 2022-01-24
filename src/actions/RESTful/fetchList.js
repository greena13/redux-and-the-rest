import { LIST, ITEM } from '../../constants/DataStructures';
import { ERROR, FETCHING, SUCCESS } from '../../constants/Statuses';

import getListKey from '../../action-creators/helpers/getListKey';
import generateUrl from '../../action-creators/helpers/generateUrl';
import makeRequest from '../../action-creators/helpers/makeRequest';
import getItemKey from '../../action-creators/helpers/getItemKey';
import applyTransforms from '../../reducers/helpers/applyTransforms';
import wrapInObject from '../../utils/object/wrapInObject';
import mergeStatus from '../../reducers/helpers/mergeStatus';
import { isRequestInProgress, registerRequestStart } from '../../utils/RequestManager';
import nop from '../../utils/function/nop';


const HTTP_REQUEST_TYPE = 'GET';

/** ************************************************************************************************************
 * Action creator thunk
 ***************************************************************************************************************/

/**
 * @typedef {RemoteActionCreatorOptionsWithMetadata} FetchListActionCreatorOptions
 *
 * @property {Metadata} [itemsMetadata] Defines the metadata of each item in the list (the metadata
 *           is applied to the list).
 * @property {boolean} [force=false] Whether to ignore any outstanding requests with the same URL and make
 *          the request again, anyway
 */

/**
 * Redux action creator used for fetching a list or resources from an index RESTful API endpoint
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} params A string or object that is serialized and used to fill in the dynamic parameters
 *        of the resource's URL
 * @param {FetchListActionCreatorOptions} [actionCreatorOptions={}] The options passed to the action creator when it is called.
 * @returns {Thunk} Function to call to dispatch an action
 */
function actionCreator(options, params, actionCreatorOptions = {}) {
  const {
    action, url: urlTemplate, keyBy, urlOnlyParams, progress, request = {}, method = HTTP_REQUEST_TYPE
  } = options;

  const key = getListKey(params, { urlOnlyParams });
  const url = generateUrl({ urlTemplate }, params);

  if (!actionCreatorOptions.force && isRequestInProgress(method, url)) {
    return nop;
  } else {
    registerRequestStart(method, url);
  }

  return (dispatch) => {
    const requestedAt = Date.now();

    /**
     * Action creator options override metadata options that may have been set when defining the resource
     */
    const metadata = actionCreatorOptions.metadata || options.metadata || {};

    /**
     * Immediately dispatch an action to change the state of the list to be FETCHING
     */
    dispatch(requestList({ action, metadata, requestedAt }, key));

    /**
     * Make a request to the external API and dispatch another action when the response is received, populating
     * the store with the contents of its body and changing the state to SUCCESS or ERROR, depending on the
     * result.
     */
    return makeRequest({
      ...options,
      key, keyBy, params,
      url,
      requestedAt,
      dispatch,
      request: {
        method,
        ...request,
      },
      onSuccess: receiveList,
      onError: handleListError,
      progress
    }, actionCreatorOptions);
  };
}

function localActionCreator() {
  throw new Error('fetchList is not supported with the localOnly option. User getOrFetchList instead.');
}

/** ************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Creates an action object to update the Redux store to list a resource list as FETCHING
 * @param {Object} options Options specified when defining the resource and action
 * @param {string} key Key to use to index the list in the Redux store
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function requestList(options, key) {
  const { action, metadata, requestedAt } = options;

  return {
    type: action,
    status: FETCHING,
    list: {
      ...LIST,
      status: { type: FETCHING, requestedAt },

      /**
       * Metadata from action creators or options, to override anything that's currently there
       */
      metadata
    },
    key,
  };
}

/**
 * Creates an action object to update the Redux store to list a resource list as being successfully
 * received from an external API
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions Options passed to the action creator
 * @param {Object[]} list List of resources received from the external API in the response
 * @param {Object} [metadata] Metadata extracted from the response, using a responseAdaptor (if applicable)
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function receiveList(options, actionCreatorOptions, list, metadata) {
  const { transforms, key, keyBy, action, params, requestedAt, singular } = options;

  const positions = [];

  const syncedAt = Date.now();

  /**
   * Build a dictionary or resource items, correctly indexed by their keys and populate a flat list of
   * what position each item in that list occupies in the list of resources.
   * @type {Object<ListKey, ResourcesList>}
   */
  const items = list.reduce((memo, values) => {
    const normalizedParams = wrapInObject(params, keyBy);
    const itemKey = getItemKey([values, normalizedParams], { keyBy, singular });

    /**
     * Push the item's key to the positions list to record where in the list the item is located
     */
    positions.push(itemKey);

    memo[itemKey] = applyTransforms(transforms, options, actionCreatorOptions, {
      ...ITEM,
      values,
      status: { type: SUCCESS, requestedAt, syncedAt },
      metadata: actionCreatorOptions.itemsMetadata || options.metadata || {},
    });

    return memo;
  }, {});

  return {
    type: action,
    status: SUCCESS,
    items,
    key,
    list: {
      positions,
      status: { type: SUCCESS, syncedAt, itemsInLastResponse: Object.keys(items).length },

      /**
       * metadata from a responseAdaptor (if applicable) to be merged in with the existing metadata
       */
      metadata
    }
  };
}

/**
 * Creates an action object to update the Redux store to mark a resource list as errored when it was
 * requested from an external API
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions Options passed to the action creator
 * @param {number} httpCode The HTTP status code of the error response
 * @param {object} errorEnvelope An object containing the details of the error
 * @param {Object} [metadata] Metadata extracted from the response, using errorHandler (if applicable)
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function handleListError(options, actionCreatorOptions, httpCode, errorEnvelope, metadata) {
  const { action, key } = options;

  return {
    type: action,
    status: ERROR,
    key,
    ...errorEnvelope,
    httpCode,
    errorOccurredAt: Date.now(),
    metadata
  };
}

/** ************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

/**
 * Handles reducing a resource list in a Redux store as it moves through its lifecycle events
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources
 * @param {ActionObject} action The action containing the data to update the resource state
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, action) {
  const { status, items, key, httpCode, list, error, errors, errorOccurredAt, metadata = {} } = action;
  const currentList = resources.lists[key] || LIST;

  /**
   * NOTE: FETCHING occurs first and then *either* SUCCESS or ERROR, but FETCHING may also occur after a
   * previous SUCCESS or ERROR.
   */

  if (status === FETCHING) {

    /**
     * When a list is being fetched, we simply update the list's status and metadata values,
     * leaving any items in the list that are already there untouched.
     *
     * Note we completely override the metadata object with the new values - we dont' merge it.
     */
    return {
      ...resources,
      lists: {
        ...resources.lists,
        [key]: {
          ...currentList,

          /**
           * We persist the syncedAt attribute of the list if it's been fetched in the past, in case
           * the request fails, we know the last time it was successfully retrieved
           */
          status: mergeStatus(currentList.status, list.status, { onlyPersist: ['syncedAt', 'itemsInLastResponse'] }),

          /**
           * For metadata specified at the time of the call (usually using actionOptions), it overrides any
           * existing values completely
           */
          metadata: list.metadata
        }
      }
    };
  } else if (status === SUCCESS) {

    /**
     * When a list has been successfully fetched, we merge the items contained in the API's response
     * body with those already in the store. This allows us to work with pagination and fetch more items on
     * the next "page" of the list.
     */
    const newItems = {
      ...resources.items,
      ...items,
    };

    const newList = {
      ...resources.lists,
      [key]: {
        ...list,

        /**
         * We add all status attributes that were added since the request was started (currently only the
         * syncedAt value).
         */
        status: mergeStatus(currentList.status, list.status),

        /**
         * For metadata extracted from the response, we merge it with the existing metadata already available
         */
        metadata: { ...currentList.metadata, ...list.metadata }
      }
    };

    return {
      ...resources,
      items: newItems,
      lists: newList,
    };

  } else if (status === ERROR) {

    /**
     * When the attempt to fetch a list from the API results in an error, we leave the current contents
     * of the list and update its state and metadata to reflect the details of the error.
     */
    const newLists = {
      ...resources.lists,
      [key]: {
        ...currentList,

        /**
         * We merge in new status attributes about the details of the error.
         */
        status: mergeStatus(currentList.status, {
          type: status,
          httpCode,
          error, errors, errorOccurredAt
        }, { exclude: ['itemsInLastResponse'] }),

        /**
         * For metadata extracted from the response, we merge it with the existing metadata already available
         */
        metadata: { ...currentList.metadata, ...metadata }
      }
    };

    return {
      ...resources,
      lists: newLists
    };

  } else {
    return resources;
  }
}

export default {
  reducer,
  actionCreator,
  localActionCreator
};
