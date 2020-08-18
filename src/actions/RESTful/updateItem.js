import getItemKey from '../../action-creators/helpers/getItemKey';
import generateUrl from '../../action-creators/helpers/generateUrl';
import wrapInObject from '../../utils/object/wrapInObject';
import makeRequest from '../../action-creators/helpers/makeRequest';
import assertInDevMode from '../../utils/assertInDevMode';
import warn from '../../utils/dev/warn';
import { ERROR, NEW, SUCCESS, UPDATING } from '../../constants/Statuses';
import { ITEM } from '../../constants/DataStructures';
import applyTransforms from '../../reducers/helpers/applyTransforms';
import mergeStatus from '../../reducers/helpers/mergeStatus';
import without from '../../utils/list/without';
import { isRequestInProgress, registerRequestStart } from '../../utils/RequestManager';
import nop from '../../utils/function/nop';
import adaptOptionsForSingularResource from '../../action-creators/helpers/adaptOptionsForSingularResource';

const HTTP_REQUEST_TYPE = 'PUT';

/** ************************************************************************************************************
 * Action creator thunk
 ***************************************************************************************************************/


/**
 * @typedef {RemoteActionCreatorOptionsWithMetadata} UpdateItemActionCreatorOptions
 *
 * @property {Object} [previousValues] The values of the resource item being updated, to allow more efficiently
 *          updating associated items.
 */

/**
 * Redux action creator used for sending an UPDATE request to a RESTful API endpoint
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} paramsOrValues The first argument which can either be a  string or object that is
 *        serialized and used to fill in the dynamic parameters of the resource's URL, or the attributes to use
 *        to update the resource.
 * @param {Object} [valuesOrActionCreatorOptions={}] Either the attribute values to use to update the resource or the
 *        options passed to the action creator.
 * @param {UpdateItemActionCreatorOptions} [optionalActionCreatorOptions={}] The options passed to the action creator when it is
 *        called.
 * @param {ResourceValues} [optionalActionCreatorOptions.previous={}] The values of the resource item that is being
 *        deleted, used to more efficiently remove the item from any associated resource lists it may
 *        appear in.
 * @returns {Thunk} Function to call to dispatch an action
 */
function actionCreator(options, paramsOrValues, valuesOrActionCreatorOptions, optionalActionCreatorOptions) {
  const {
    action, transforms, url: urlTemplate, progress, keyBy, metadata, requestAdaptor, request = {}
, singular } = options;

  const { params, values, actionCreatorOptions } = adaptOptionsForSingularResource(singular, [
      paramsOrValues,
      valuesOrActionCreatorOptions,
      optionalActionCreatorOptions
  ]);

  const normalizedParams = wrapInObject(params, keyBy);
  const url = generateUrl({ urlTemplate }, wrapInObject(normalizedParams, keyBy));

  if (actionCreatorOptions.force || isRequestInProgress(HTTP_REQUEST_TYPE, url)) {
    return nop;
  } else {
    registerRequestStart(HTTP_REQUEST_TYPE, url);
  }

  const key = getItemKey(normalizedParams, { keyBy, singular });

  return (dispatch) => {
    const requestedAt = Date.now();

    dispatch(
      submitUpdateResource(
        { transforms, action, key, metadata, requestedAt },
        actionCreatorOptions,
        values,
        actionCreatorOptions
      )
    );

    return makeRequest({
      ...options,

      previousValues: actionCreatorOptions.previousValues,
      url,
      key, keyBy,
      params: normalizedParams,
      requestedAt,
      dispatch,
      request: {
        method: HTTP_REQUEST_TYPE,
        body: JSON.stringify(requestAdaptor ? requestAdaptor(values) : values),
        ...request
      },
      onSuccess: receiveUpdatedResource,
      onError: handleUpdateResourceError,
      progress
    }, actionCreatorOptions);
  };
}

/** ************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Creates an action object to update a new resource item as being created on a remote API
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} [actionCreatorOptions={}] The options passed to the update* action creator function
 * @param {Object} values The attributes of the resource currently being created
 * @returns {Object} Action Object that will be passed to the reducers to update the Redux state
 */
function submitUpdateResource(options, actionCreatorOptions, values) {
  const { transforms, action, key, requestedAt } = options;

  /**
   * Action creator options override metadata options that may have been set when defining the resource
   */
  const metadata = actionCreatorOptions.metadata || options.metadata;

  return {
    type: action,
    status: UPDATING, key,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      values,
      status: { type: UPDATING, requestedAt },
      metadata
    }),
    previousValues: actionCreatorOptions.previousValues
  };
}

/**
 * Redux action creator used for updating a resource locally (without making any requests to a RESTful API endpoint)
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} params A string or object that is serialized and used to fill in the dynamic parameters
 *        of the resource's URL
 * @param {Object} values The attribute values to use to update the resource
 * @param {Object} [actionCreatorOptions={}] The options passed to the action creator when it is called.
 * @returns {Object} Action Object that will be passed to the reducers to update the Redux state
 */
function localActionCreator(options, params, values, actionCreatorOptions = {}) {

  /**
   * Action creator options override metadata options that may have been set when defining the resource
   */
  const metadata = actionCreatorOptions.metadata || options.metadata;

  return receiveUpdatedResource(
    { ...options, params },
    actionCreatorOptions,
    values,
    metadata,
    actionCreatorOptions.previous
  );
}

/**
 * Creates an action object to update a resource item after it's been confirmed as updated on an external API
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions Options passed to the action creator
 * @param {Object} values The values returned by the external API for the newly created resource item
 * @param {Object} [metadata] Metadata extracted from the response, using a responseAdaptor (if applicable)
 * @param {Object} previousValues The values the resource item previously had, which is used to more efficiently
 *        update any associated resource items or lists
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function receiveUpdatedResource(options, actionCreatorOptions, values, metadata, previousValues) {
  const { transforms, action, params, keyBy, localOnly, singular } = options;

  const normalizedParams = wrapInObject(params, keyBy);

  return {
    type: action,
    status: SUCCESS,
    key: getItemKey([values, normalizedParams], { keyBy, singular }),
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      values,
      status: { type: SUCCESS, syncedAt: Date.now() },

      /**
       * metadata from a responseAdaptor (if applicable) to be merged in with the existing metadata
       */
      metadata,
    }),
    previousValues,
    localOnly
  };
}

/**
 * Creates an action object to update the Redux store to mark a resource item as errored when the request to
 * update it on the external API failed
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions Options passed to the action creator
 * @param {number} httpCode The HTTP status code of the error response
 * @param {object} errorEnvelope An object containing the details of the error
 * @param {Object} [metadata] Metadata extracted from the response, using a responseAdaptor (if applicable)
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function handleUpdateResourceError(options, actionCreatorOptions, httpCode, errorEnvelope, metadata) {
  const { action, key } = options;

  return {
    type: action,
    status: ERROR, key,

    /**
     * metadata from a responseAdaptor (if applicable) to be merged in with the existing metadata
     */
    metadata,
    httpCode,
    ...errorEnvelope,
    errorOccurredAt: Date.now()
  };
}

/** ************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

/**
 * Handles reducing a resource item in a Redux store as it moves through the stages of it being updated
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources item
 * @param {ActionObject} action The action containing the data to update the resource state
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, action) {
  const { type, key, status, item, httpCode, error, errors, errorOccurredAt, metadata } = action;
  const { items } = resources;

  assertInDevMode(() => {

    /**
     * We warn if the user is attempting to update a resource item that doesn't exist in the Redux store, or
     * if the user is attempting to update a resource that has not yet been saved to the external API
     */
    if (!items[key]) {
      warn(
        `${type}'s key '${key}' did not match any items in the store. Check the arguments passed to ` +
        'updateItem(). (Update request still sent to the server.)'
      );
    } else if (items[key].status.type === NEW) {
      warn(
        `${type}'s key '${key}' matched a new resource. Use editItem() to modify an item that has ` +
        'not been saved to the server yet. (Update request still sent to the server.)'
      );
    }
  });

  const currentItem = items[key] || ITEM;

  if (status === UPDATING) {

    /**
     * While updating (waiting for the update to be confirmed by an external API), we shallow merge the new
     * attribute values with the exist ones for the resource item
     */
    const newValues = {
      ...currentItem.values,
      ...item.values
    };

    const newItems = {
      ...items,
      [key]: {
        ...item,
        values: newValues,

        /**
         * We persist the syncedAt attribute of the item if it's been fetched in the past, in case
         * the request fails, we know the last time it was successfully retrieved.
         */
        status: mergeStatus(currentItem.status, item.status, { onlyPersist: ['syncedAt', 'dirty', 'originalValues'] }),
      }
    };

    return {
      ...resources,
      items: newItems,
    };

  } else if (status === SUCCESS) {

    /**
     * When the external API confirms the update has completed, we merge any attribute values returned by
     * the server into those already saved in the Redux store, and update the status to be SUCCESS
     */
    const newValues = {
      ...currentItem.values,
      ...item.values
    };

    const newItems = {
      ...items,
      [key]: {
        ...item,
        values: newValues,

        /**
         * We add all status attributes that were added since the request was started (currently only the
         * syncedAt value).
         */
        status: mergeStatus(without(currentItem.status, ['dirty', 'originalValues']), item.status),

        /**
         * For metadata extracted from the response, we merge it with the existing metadata already available
         */
        metadata: { ...currentItem.metadata, ...item.metadata }
      }
    };

    return {
      ...resources,
      items: newItems,
    };

  } else if (status === ERROR) {

    /**
     * If the request to update the resource item failed, we store the details of the error from the response
     * in the status of the resource item and leave the item's attributes as they were expected to be if the
     * update had succeeded.
     */
    const newItems = {
      ...items,
      [key]: {
        ...items[key],

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
    };

    return {
      ...resources,
      items: newItems,
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
