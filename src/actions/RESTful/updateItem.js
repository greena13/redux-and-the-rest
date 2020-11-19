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
import arrayFrom from '../../utils/array/arrayFrom';
import toPlural from '../../utils/string/toPlural';
import valuesAdded from '../../utils/array/valuesAdded';
import valuesRemoved from '../../utils/array/valuesRemoved';
import contains from '../../utils/list/contains';
import extractListOperations from '../../action-creators/helpers/extractListOperations';
import applyListOperators from '../../reducers/helpers/applyListOperators';
import getHttpStatusCode from '../../public-helpers/getHttpStatusCode';

const HTTP_REQUEST_TYPE = 'PUT';

/** ************************************************************************************************************
 * Action creator thunk
 ***************************************************************************************************************/


/**
 * @typedef {RemoteActionCreatorOptionsWithMetadata} UpdateItemActionCreatorOptions
 *
 * @property {Object} [previousValues] The values of the resource item being updated, to allow more efficiently
 *          updating associated items.
 * * @property {Array<string[], function>} [sort=[]] An array of tuples where the first element is an array of list keys
 *           and the second is a sorter function that accepts an array of items in their current order
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
    action, transforms, url: urlTemplate, progress, keyBy,
    metadata, requestAdaptor, request = {}, singular,
    urlOnlyParams, method = HTTP_REQUEST_TYPE
  } = options;

  const { params, values, actionCreatorOptions } =
    adaptOptionsForSingularResource({ paramsOptional: singular, acceptsValues: true }, [
      paramsOrValues,
      valuesOrActionCreatorOptions,
      optionalActionCreatorOptions
  ]);

  const normalizedParams = wrapInObject(params, keyBy);
  const url = generateUrl({ urlTemplate }, wrapInObject(normalizedParams, keyBy));

  if (actionCreatorOptions.force || isRequestInProgress(method, url)) {
    return nop;
  } else {
    registerRequestStart(method, url);
  }

  const key = getItemKey(normalizedParams, { keyBy, singular });

  return (dispatch) => {
    const listOperations = extractListOperations(actionCreatorOptions, urlOnlyParams);
    const requestedAt = Date.now();

    dispatch(
      submitUpdateResource(
        { transforms, action, key, metadata, requestedAt },
        actionCreatorOptions,
        values,
        listOperations
      )
    );

    return makeRequest({
      ...options,

      /**
       * Values common/shared with local version of action creator
       */
      params: normalizedParams,
      listOperations,

      /**
       * Values not used by local version of action creator (unique to the async action creator)
       */

      /**
       * Note: key is required for failure handler (because server doesn't generate a new id to replace it)
       */
      key,

      /**
       * Values used by makeRequest
       */
      url,
      request: {
        method,
        body: JSON.stringify(requestAdaptor ? requestAdaptor(values) : values),
        ...request
      },
      dispatch,
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
 * @param {Object} [listOperations={}] Options for how the lists containing the updated item should be updated
 * @returns {Object} Action Object that will be passed to the reducers to update the Redux state
 */
function submitUpdateResource(options, actionCreatorOptions, values, listOperations) {
  const { transforms, action, key, requestedAt } = options;

  /**
   * Action creator options override metadata options that may have been set when defining the resource
   */
  const metadata = actionCreatorOptions.metadata || options.metadata;

  return {
    type: action,
    status: UPDATING, key,
    listOperations,
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
 * @param {Object|string} paramsOrValues The first argument which can either be a string or object that is
 *        serialized and used to find the item to update.
 * @param {Object} [valuesOrActionCreatorOptions={}] Either the attribute values to use to update the resource or the
 *        options passed to the action creator.
 * @param {UpdateItemActionCreatorOptions} [optionalActionCreatorOptions={}] The options passed to the action creator when it is
 *        called.
 * @param {ResourceValues} [optionalActionCreatorOptions.previous={}] The values of the resource item that is being
 *        deleted, used to more efficiently remove the item from any associated resource lists it may
 *        appear in.
 * @returns {Object} Action Object that will be passed to the reducers to update the Redux state
 */
function localActionCreator(options, paramsOrValues, valuesOrActionCreatorOptions, optionalActionCreatorOptions) {
  const { urlOnlyParams, keyBy, singular } = options;

  const { params, values, actionCreatorOptions } =
    adaptOptionsForSingularResource({ paramsOptional: singular, acceptsValues: true }, [
      paramsOrValues,
      valuesOrActionCreatorOptions,
      optionalActionCreatorOptions
    ]);

  /**
   * Action creator options override metadata options that may have been set when defining the resource
   */
  const metadata = actionCreatorOptions.metadata || options.metadata;

  const normalizedParams = wrapInObject(params, keyBy);
  const listOperations = extractListOperations(actionCreatorOptions, urlOnlyParams);

  return receiveUpdatedResource(
    {
      ...options,
      params: normalizedParams,
      listOperations,
    },
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
 * @param {Number} httpCode The HTTP status code of the response
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function receiveUpdatedResource(options, actionCreatorOptions, values, metadata, httpCode) {
  const { transforms, action, params, listOperations, keyBy, localOnly, singular } = options;
  const { previousValues } = actionCreatorOptions;

  return {
    type: action,
    status: SUCCESS,
    key: getItemKey([values, params], { keyBy, singular }),
    listOperations,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      values,
      status: { type: SUCCESS, httpCode, syncedAt: Date.now() },

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
  const { action, key, localOnly } = options;

  return {
    type: action,
    status: ERROR, key,

    /**
     * metadata from a responseAdaptor (if applicable) to be merged in with the existing metadata
     */
    metadata,
    httpCode,
    ...errorEnvelope,
    errorOccurredAt: Date.now(),
    localOnly
  };
}

/** ************************************************************************************************************
 * Reducers
 ***************************************************************************************************************/

/**
 * Handles reducing a resource item in a Redux store as it moves through the stages of it being updated
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources item
 * @param {ActionObject} action The action containing the data to update the resource state
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, action) {
  const { localOnly, type, key, listOperations = {}, status, item, httpCode, error, errors, errorOccurredAt, metadata } = action;
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

    const updatedItem = {
      ...item,
      values: newValues,

      /**
       * We persist the syncedAt attribute of the item if it's been fetched in the past, in case
       * the request fails, we know the last time it was successfully retrieved.
       */
      status: mergeStatus(currentItem.status, item.status, { onlyPersist: ['syncedAt', 'dirty', 'originalValues'] }),
    };

    const newItems = {
      ...items,
      [key]: updatedItem
    };

    const newLists = applyListOperators({ ...resources, items: newItems }, listOperations, key);

    return {
      ...resources,
      items: newItems,
      lists: newLists
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

    const updatedItem = {
      ...item,

      /**
       * For 204 No Content responses, we stick with the current item values rather than overwriting them with
       * the empty ones from the remote API
       */
      values: getHttpStatusCode(item) === 204 ? currentItem.values : newValues,

      /**
       * We add all status attributes that were added since the request was started (currently only the
       * syncedAt value).
       */
      status: mergeStatus(without(currentItem.status, ['dirty', 'originalValues']), item.status),

      /**
       * For metadata extracted from the response, we merge it with the existing metadata already available
       */
      metadata: { ...currentItem.metadata, ...item.metadata }
    };

    const newItems = {
      ...items,
      [key]: updatedItem
    };

    const newLists = function(){
      if (localOnly) {

        /**
         * For the local action creator, the UPDATING state is skipped and the list operations have not been
         * performed, so we're doing them for the first time.
         */
        return applyListOperators({ ...resources, items: newItems }, listOperations, key);
      } else {
        return resources.lists;
      }
    }();


    return {
      ...resources,
      lists: newLists,
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

/**
 * Handles updating <i>associated</i> resources when the primary one is updated
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the <i>associated</i> resources item
 * @returns {ResourcesReduxState} The new resource state
 */
function hasManyAssociationsReducer(resources, { key, type, status, item: associatedItem, previousValues }, { relationType, foreignKeyName, name, keyName }) {
  if (status === SUCCESS) {
    const associationValues = associatedItem.values;
    const newForeignKeys = arrayFrom(associationValues[foreignKeyName] || associationValues[toPlural(foreignKeyName)]);

    if (previousValues) {
      const previousForeignKeys = arrayFrom(previousValues[foreignKeyName] || previousValues[toPlural(foreignKeyName)]);
      const addedAssociationKeys = valuesAdded(newForeignKeys, previousForeignKeys);
      const removedAssociationKeys = valuesRemoved(newForeignKeys, previousForeignKeys);

      return {
        ...resources,
        items: {
          ...resources.items,

          ...(addedAssociationKeys.reduce((memo, addedKey) => {
            const item = resources.items[addedKey];

            const newKeys = function(){
              if (relationType === 'hasAndBelongsToMany') {
                return [
                  key,
                  ...without(item.values[keyName] || [], key)
                ];
              } else {
                return key;
              }
            }();

            if (item) {
              memo[addedKey] = {
                ...item,
                values: {
                  ...item.values,
                  [keyName]: newKeys
                }
              };
            }

            return memo;
          }, {})),

          ...(removedAssociationKeys.reduce((memo, addedKey) => {
            const item = resources.items[addedKey];

            const newValues = function(){
              if (relationType === 'hasAndBelongsToMany') {
                return {
                  ...item.values,
                  [keyName]: without(item.values[keyName] || [], key)
                };
              } else {
                return without(item.values, keyName);
              }
            }();

            if (item) {
              memo[addedKey] = {
                ...item,
                values: newValues
              };
            }

            return memo;
          }, {}))
        }
      };

    } else {
      assertInDevMode(() => {
        warn(
          `${type} did not specify any previous values. This makes updating '${name}.${keyName}' much ` +
          'less efficient. Use the previousValues option for updateItem() to specify these values.'
        );
      });

      return {
        ...resources,
        items: Object.keys(resources.items).reduce((memo, itemKey) => {
          const item = resources.items[itemKey];

          const newValues = function(){
            if (contains(newForeignKeys, itemKey, { stringifyFirst: true })) {
              if (relationType === 'hasAndBelongsToMany') {
                return {
                  ...item.values,
                  [keyName]: [
                    key,
                    ...without(item.values[keyName] || [], key)
                  ]
                };
              } else {
                return {
                  ...item.values,
                  [keyName]: key
                };
              }
            } else {
              if (relationType === 'hasAndBelongsToMany') {
                return {
                  ...item.values,
                  [keyName]: without(item.values[keyName] || [], key)
                };
              } else {
                return without(item.values, keyName);
              }
            }
          }();

          memo[itemKey] = {
            ...item,
            values: newValues
          };

          return memo;
        }, {})
      };

    }

  } else {
    return resources;
  }
}


export default {
  reducer,
  hasManyAssociationsReducer,
  actionCreator,
  localActionCreator
};
