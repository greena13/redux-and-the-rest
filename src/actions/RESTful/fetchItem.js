import getItemKey from '../../action-creators/helpers/getItemKey';
import generateUrl from '../../action-creators/helpers/generateUrl';
import makeRequest from '../../action-creators/helpers/makeRequest';
import { ERROR, FETCHING, SUCCESS } from '../../constants/Statuses';
import { ITEM } from '../../constants/DataStructures';

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
 * Redux action creator used for fetching a single resource item from a fetch RESTful API endpoint
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} params A string or object that is serialized and used to fill in the dynamic parameters
 *        of the resource's URL
 * @param {RemoteActionCreatorOptionsWithMetadata} [actionCreatorOptions={}] The options passed to the action creator when it is called.
 * @returns {Thunk} Function to call to dispatch an action
 */
function actionCreator(options, params, actionCreatorOptions = {}) {
  const {
    action, transforms, url: urlTemplate, keyBy, progress, request = {}, singular, metadata
  } = options;

  const normalizedParams = wrapInObject(params, keyBy);
  const url = generateUrl({ urlTemplate }, normalizedParams);

  if (!actionCreatorOptions.force && isRequestInProgress(HTTP_REQUEST_TYPE, url)) {
    return nop;
  } else {
    registerRequestStart(HTTP_REQUEST_TYPE, url);
  }

  const key = getItemKey(normalizedParams, { keyBy, singular });

  return (dispatch) => {
    const requestedAt = Date.now();

    /**
     * Immediately dispatch an action to change the state of the resource item to be FETCHING
     */
    dispatch(requestResource({ action, transforms, key, metadata, requestedAt }, actionCreatorOptions));

    /**
     * Make a request to the external API and dispatch another action when the response is received, populating
     * the store with the contents of its body and changing the state to SUCCESS or ERROR, depending on the
     * result.
     */
    return makeRequest({
      ...options,
      key, keyBy, params,
      url,
      request: {
        method: HTTP_REQUEST_TYPE,
        ...request
      },
      requestedAt,
      dispatch,
      onSuccess: receiveResource,
      onError: handleResourceError,
      progress
    }, actionCreatorOptions);
  };
}

/** ************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Creates an action object to update the Redux store to list a resource item as FETCHING
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions Options passed to the action creator
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function requestResource(options, actionCreatorOptions) {
  const { transforms, action, key, requestedAt } = options;

  /**
   * Action creator options override metadata options that may have been set when defining the resource
   */
  const metadata = actionCreatorOptions.metadata || options.metadata || {};

  return {
    type: action,
    status: FETCHING,
    key,

    item: applyTransforms(transforms, options, actionCreatorOptions, {
      ...ITEM,
      values: {},
      status: { type: FETCHING, requestedAt },
      metadata
    })
  };
}

/**
 * Creates an action object to update the Redux store to list a resource item as successfully received from
 * an external API
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions Options passed to the action creator
 * @param {Object} values The attributes of the resource item
 * @param {Object} [metadata] Metadata extracted from the response, using a responseAdaptor (if applicable)
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function receiveResource(options, actionCreatorOptions, values, metadata = {}) {
  const { transforms, action, params, keyBy, singular } = options;

  const item = applyTransforms(transforms, options, actionCreatorOptions, {
    ...ITEM,
    values,
    status: { type: SUCCESS, syncedAt: Date.now() },

    /**
     * metadata from a responseAdaptor (if applicable) to be merged in with the existing metadata
     */
    metadata,
  });

  const normalizedParams = wrapInObject(params, keyBy);

  return {
    type: action,
    status: SUCCESS,
    key: getItemKey([item.values, normalizedParams], { keyBy, singular }),
    item,
  };
}

/**
 * Creates an action object to update the Redux store to mark a resource item as errored when it was
 * requested from an external API
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions Options passed to the action creator
 * @param {number} httpCode The HTTP status code of the error response
 * @param {object} errorEnvelope An object containing the details of the error
 * @param {Object} [metadata] Metadata extracted from the response, using a responseAdaptor (if applicable)
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function handleResourceError(options, actionCreatorOptions, httpCode, errorEnvelope, metadata) {
  const { action, key } = options;

  return {
    type: action,
    status: ERROR,

    /**
     * metadata from a responseAdaptor (if applicable) to be merged in with the existing metadata
     */
    metadata,
    httpCode,
    key,
    ...errorEnvelope,
    errorOccurredAt: Date.now()
  };
}

/** ************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/


/**
 * Handles reducing a resource item in a Redux store as it moves through its lifecycle events
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources
 * @param {ActionObject} action The action containing the data to update the resource state
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, action) {
  const { status, key, httpCode, item, error, errors, errorOccurredAt, metadata } = action;

  /**
   * Fetch the current values for the resource if they are already in the store, otherwise fallback to an
   * empty resource item
   */
  const currentItem = resources.items[key] || ITEM;

  if (status === FETCHING) {

    /**
     * We persist the syncedAt attribute of the item if it's been fetched in the past, in case
     * the request fails, we know the last time it was successfully retrieved.
     */
    const newStatus = mergeStatus(currentItem.status, item.status, { onlyPersist: ['syncedAt'] });

    if (currentItem.status.type === SUCCESS) {

      /**
       * When a resource item is being fetched and that resource already exists in the store - i.e. we are
       * re-retrieving it from the external APi - then we persist the values already in the store and update the
       * rest of the item's information, such as its state and metadata.
       *
       * This allows use to move between metadatas of less data to more data (e.g. a PREVIEW to a FULL)
       * without losing any attribute values we already have at any point in the resource's lifecycle. This is
       * useful when displaying a preview of a resource until all the values have arrived.
       */

      return {
        ...resources,
        items: {
          ...resources.items,
          [key]: {
            ...item,
            values: {
              ...currentItem.values,
              ...item.values
            },
            status: newStatus,
          }
        }
      };

    } else {

      /**
       * When a resource item is being fetched and it does NOT already exist in the store, we simply take the
       * entire set of attributes of the item (including its values, state and metadata) and add them to the
       * store.
       */

      return {
        ...resources,
        items: {
          ...resources.items,
          [key]: {
            ...item,
            status: newStatus,
          }
        }
      };
    }

  } else if (status === SUCCESS) {

    /**
     * When a resource item has been successfully fetched, we merge the item's current status information with
     * the action's new status information and then allow the new item values to override whatever is already
     * in the store.
     */

    return {
      ...resources,
      items: {
        ...resources.items,
        [key]: {
          ...item,

          /**
           * We add all status attributes that were added since the request was started (currently only the
           * syncedAt value).
           */
          status: mergeStatus(currentItem.status, item.status),

          /**
           * For metadata extracted from the response, we merge it with the existing metadata already available
           */
          metadata: { ...currentItem.metadata, ...item.metadata }
        }
      }
    };

  } else if (status === ERROR) {

    return {
      ...resources,
      items: {
        ...resources.items,
        [key]: {
          ...currentItem,

          /**
           * We merge in new status attributes about the details of the error.
           */
          status: mergeStatus(currentItem.status, {
            type: status,
            httpCode,
            error, errors, errorOccurredAt
          }),

          /**
           * For metadata extracted from the response, we merge it with the existing metadata already available
           */
          metadata: { ...currentItem.metadata, ...metadata }
        }
      }
    };

  } else {
    return resources;
  }
}

export default {
  reducer,
  actionCreator
};
