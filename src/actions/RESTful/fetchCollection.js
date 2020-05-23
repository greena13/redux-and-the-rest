import { COLLECTION, ITEM } from '../../constants/DataStructures';
import { ERROR, FETCHING, SUCCESS } from '../../constants/Statuses';
import { COMPLETE } from '../../constants/ProjectionTypes';

import getCollectionKey from '../../action-creators/helpers/getCollectionKey';
import generateUrl from '../../action-creators/helpers/generateUrl';
import makeRequest from '../../action-creators/helpers/makeRequest';
import getItemKey from '../../action-creators/helpers/getItemKey';
import applyTransforms from '../../reducers/helpers/applyTransforms';
import projectionTransform from '../../action-creators/helpers/transforms/projectionTransform';
import wrapInObject from '../../utils/object/wrapInObject';
import mergeStatus from '../../reducers/helpers/mergeStatus';
import { isRequestInProgress, registerRequestStart } from '../../utils/RequestManager';
import nop from '../../utils/function/nop';


const HTTP_REQUEST_TYPE = 'GET';

/** ************************************************************************************************************
 * Action creator thunk
 ***************************************************************************************************************/

/**
 * Redux action creator used for fetching a collection or resources from an index RESTful API endpoint
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} params A string or object that is serialized and used to fill in the dynamic parameters
 *        of the resource's URL
 * @param {Object} [actionCreatorOptions={}] The options passed to the action creator when it is called.
 * @returns {Thunk} Function to call to dispatch an action
 */
function actionCreator(options, params, actionCreatorOptions = {}) {
  const {
    action, url: urlTemplate, keyBy, urlOnlyParams, progress, projection, request = {}
  } = options;

  const key = getCollectionKey(params, { urlOnlyParams });
  const url = generateUrl({ urlTemplate }, params);

  if (actionCreatorOptions.force || isRequestInProgress(HTTP_REQUEST_TYPE, url)) {
    return nop;
  } else {
    registerRequestStart(HTTP_REQUEST_TYPE, url);
  }

  return (dispatch) => {
    const requestedAt = Date.now();

    /**
     * Immediately dispatch an action to change the state of the collection to be FETCHING
     */
    dispatch(requestCollection({ action, projection: actionCreatorOptions.projection || projection, requestedAt }, key));

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
        method: HTTP_REQUEST_TYPE,
        ...request,
      },
      onSuccess: receiveCollection,
      onError: handleCollectionError,
      progress
    }, actionCreatorOptions);
  };
}

/** ************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Creates an action object to update the Redux store to list a resource collection as FETCHING
 * @param {Object} options Options specified when defining the resource and action
 * @param {string} key Key to use to index the collection in the Redux store
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function requestCollection(options, key) {
  const { action, projection = { type: COMPLETE }, requestedAt } = options;

  return {
    type: action,
    status: FETCHING,
    collection: {
      ...COLLECTION,
      status: { type: FETCHING, requestedAt },
      projection
    },
    key,
  };
}

/**
 * Creates an action object to update the Redux store to list a resource collection as being successfully
 * received from an external API
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions Options passed to the action creator
 * @param {Object[]} collection List of resources received from the external API in the response
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function receiveCollection(options, actionCreatorOptions, collection) {
  const { transforms, key, keyBy, action, params, requestedAt, singular } = options;

  const positions = [];

  const syncedAt = Date.now();

  /**
   * Build a dictionary or resource items, correctly indexed by their keys and populate a flat list of
   * what position each item in that collection occupies in the list of resources.
   * @type {Object<CollectionKey, ResourcesCollection>}
   */
  const items = collection.reduce((memo, values) => {
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
    });

    return memo;
  }, {});

  return {
    type: action,
    status: SUCCESS,
    items,
    key,
    collection: projectionTransform(options, actionCreatorOptions, {
      positions,
      status: { type: SUCCESS, syncedAt }
    })
  };
}

/**
 * Creates an action object to update the Redux store to mark a resource collection as errored when it was
 * requested from an external API
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions Options passed to the action creator
 * @param {number} httpCode The HTTP status code of the error response
 * @param {object} errorEnvelope An object containing the details of the error
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function handleCollectionError(options, actionCreatorOptions, httpCode, errorEnvelope) {
  const { action, key } = options;

  return {
    type: action,
    status: ERROR,
    key,
    ...errorEnvelope,
    httpCode,
    errorOccurredAt: Date.now()
  };
}

/** ************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

/**
 * Handles reducing a resource collection in a Redux store as it moves through its lifecycle events
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources
 * @param {ActionObject} action The action containing the data to update the resource state
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, action) {
  const { status, items, key, httpCode, collection, error, errors, errorOccurredAt } = action;
  const currentList = resources.collections[key] || COLLECTION;

  /**
   * NOTE: FETCHING occurs first and then *either* SUCCESS or ERROR, but FETCHING may also occur after a
   * previous SUCCESS or ERROR.
   */

  if (status === FETCHING) {

    /**
     * When a collection is being fetched, we simply update the collection's status and projection values,
     * leaving any items in the collection that are already there untouched.
     *
     * Note that we completely override the projection object with the new values - we dont' merge it.
     */
    return {
      ...resources,
      collections: {
        ...resources.collections,
        [key]: {
          ...currentList,

          /**
           * We persist the syncedAt attribute of the collection if it's been fetched in the past, in case
           * the request fails, we know the last time it was successfully retrieved
           */
          status: mergeStatus(currentList.status, collection.status, { onlyPersist: ['syncedAt'] }),
          projection: collection.projection
        }
      }
    };
  } else if (status === SUCCESS) {

    /**
     * When a collection has been successfully fetched, we merge the items contained in the API's response
     * body with those already in the store. This allows us to work with pagination and fetch more items on
     * the next "page" of the collection.
     */

    const newItems = {
      ...resources.items,
      ...items,
    };

    const newLists = {
      ...resources.collections,
      [key]: {
        ...collection,

        /**
         * We add all status attributes that were added since the request was started (currently only the
         * syncedAt value).
         */
        status: mergeStatus(currentList.status, collection.status),
      }
    };

    return {
      ...resources,
      items: newItems,
      collections: newLists,
    };

  } else if (status === ERROR) {

    /**
     * When the attempt to fetch a collection from the API results in an error, we leave the current contents
     * of the collection and update its state and projection to reflect the details of the error.
     */
    const newLists = {
      ...resources.collections,
      [key]: {
        ...currentList,

        /**
         * We merge in new status attributes about the details of the error.
         */
        status: mergeStatus(currentList.status, {
          type: status,
          httpCode,
          error, errors, errorOccurredAt
        }),
      }
    };

    return {
      ...resources,
      collections: newLists
    };

  } else {
    return resources;
  }
}

export default {
  reducer,
  actionCreator
};