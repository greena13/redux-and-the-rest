import getItemKey from '../../action-creators/helpers/getItemKey';
import generateUrl from '../../action-creators/helpers/generateUrl';
import wrapInObject from '../../utils/object/wrapInObject';
import makeRequest from '../../action-creators/helpers/makeRequest';
import assertInDevMode from '../../utils/assertInDevMode';
import warn from '../../utils/dev/warn';
import { DESTROY_ERROR, DESTROYING, NEW, SUCCESS } from '../../constants/Statuses';
import { ITEM } from '../../constants/DataStructures';
import removeItemsFromResources from '../../reducers/helpers/removeItemsFromResources';
import applyTransforms from '../../reducers/helpers/applyTransforms';
import mergeStatus from '../../reducers/helpers/mergeStatus';
import { isRequestInProgress, registerRequestStart } from '../../utils/RequestManager';
import nop from '../../utils/function/nop';
import adaptOptionsForSingularResource from '../../action-creators/helpers/adaptOptionsForSingularResource';
import isEmpty from '../../utils/list/isEmpty';
import contains from '../../utils/list/contains';
import without from '../../utils/list/without';
import arrayFrom from '../../utils/array/arrayFrom';
import toPlural from '../../utils/string/toPlural';
import serializeKey from '../../public-helpers/serializeKey';
import toSingular from '../../utils/string/toSingular';

const HTTP_REQUEST_TYPE = 'DELETE';

/** ************************************************************************************************************
 * Action creator thunk
 ***************************************************************************************************************/

/**
 * @typedef {RemoteActionCreatorOptions} DestroyItemActionCreatorOptions
 *
 * @property {Object} [previousValues] The values of the resource item being destroyed, to allow more efficiently
 *          updating associated items.
 */

/**
 * Redux action creator used for destroying a resource item by making a DELETE request to a RESTful API endpoint
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} [optionalParams={}] A string or object that is serialized and used to fill in the dynamic parameters
 *        of the resource's URL
 * @param {DestroyItemActionCreatorOptions} [optionalActionCreatorOptions={}] The options passed to the action creator when it is
 *        called.
 * @param {ResourceValues} [optionalActionCreatorOptions.previousValues={}] The values of the resource item that is being
 *        deleted, used to more efficiently remove the item from any associated resource lists it may
 *        appear in.
 * @returns {Thunk} Function to call to dispatch an action
 */
function actionCreator(options, optionalParams, optionalActionCreatorOptions) {
  const {
    action,
    keyBy,
    url: urlTemplate,
    progress,
    request = {},
    singular
  } = options;

  const { params, actionCreatorOptions } =
    adaptOptionsForSingularResource({ paramsOptional: singular, acceptsValues: false }, [
      optionalParams,
      optionalActionCreatorOptions
    ]
  );

  const normalizedParams = wrapInObject(params, keyBy);
  const url = generateUrl({ urlTemplate }, normalizedParams);

  if (actionCreatorOptions.force || isRequestInProgress(HTTP_REQUEST_TYPE, url)) {
    return nop;
  } else {
    registerRequestStart(HTTP_REQUEST_TYPE, url);
  }

  const key = getItemKey(normalizedParams, { keyBy, singular });

  return (dispatch) => {
    const requestedAt = Date.now();

    dispatch(deleteResourceUpdate({ action, key, requestedAt }, actionCreatorOptions));

    return makeRequest({
      ...options,

      /**
       * Values common/shared with local version of action creator (used by receiveCreatedResource)
       */

      /**
       * Values not used by local version of action creator (unique to the async action creator)
       */
      key,
      requestedAt,

      /**
       * Values used by makeRequest
       */
      url,
      request: {
        method: HTTP_REQUEST_TYPE,
        ...request
      },
      dispatch,
      onSuccess: removeResource,
      onError: handleDestroyItemError,
      progress
    }, actionCreatorOptions);
  };
}

/** ************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Creates an action object to update the Redux store to mark a resource item as DELETING (waiting for the
 * remote API to confirm it's been deleted)
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} values The values of the resource item that is being deleted, used to more efficiently remove
 *        the item from any associated resource lists it may appear in.
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function deleteResourceUpdate(options, { previousValues }) {
  const { action, key, requestedAt } = options;

  return {
    type: action,
    status: DESTROYING, key,
    requestedAt,
    previousValues
  };
}

/**
 * Redux action creator used for removing a resource item from the Redux store without making a DELETE request
 * to a RESTful API endpoint
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} params A string or object that is serialized and used to fill in the dynamic parameters
 *        of the resource's URL
 * @param {Object} [actionCreatorOptions={}] The options passed to the action creator when it is called.
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function localActionCreator(options, params, actionCreatorOptions = {}) {
  const { keyBy, singular } = options;
  const normalizedParams = wrapInObject(params, keyBy);

  const key = getItemKey(normalizedParams, { keyBy, singular });

  return removeResource({ ...options, key }, actionCreatorOptions);
}

/**
 * Creates an action object to update the Redux store remove a resource item after it has been confirmed as
 * deleted by a remote API
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} previousValues The values of the resource item that is being deleted, used to more
 *        efficiently remove the item from any associated resource lists it may appear in.
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function removeResource(options, { previousValues }) {
  const { action, key, localOnly } = options;

  return {
    type: action,
    status: SUCCESS, key,
    previousValues,
    localOnly
  };
}

/**
 * Creates an action object to update the Redux store to mark a resource item as errored when deleting it from
 * a remote API was attempted
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions Options passed to the action creator
 * @param {number} httpCode The HTTP status code of the error response
 * @param {object} errorEnvelope An object containing the details of the error
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function handleDestroyItemError(options, actionCreatorOptions, httpCode, errorEnvelope) {
  const { transforms, action, key } = options;

  return {
    type: action,
    status: DESTROY_ERROR, key,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      status: {
        type: DESTROY_ERROR,
        httpCode,
        ...errorEnvelope,
        errorOccurredAt: Date.now()
      },
    })
  };
}

/** ************************************************************************************************************
 * Reducers
 ***************************************************************************************************************/

/**
 * Handles reducing a resource item in a Redux store as it moves through the stages of it deletion
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources item
 * @param {ActionObject} action The action containing the data to update the resource state
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, action) {
  const { type, status, requestedAt, key, item } = action;
  assertInDevMode(() => {

    /**
     * Destroying a resource item that is not in the store is still allowed to be sent to the remote API
     * but there is nothing to remove from the local store - we still create a record of this request by adding
     * it to the store with a status of DELETING until the request has completed, though.
     */
    if (!resources.items[key]) {
      warn(`${type}'s key '${key}' did not match any items in the store. (Destroy request was still sent to the server.)`);
    }
  });

  const currentItem = resources.items[key] || ITEM;

  if (status === DESTROYING) {
    assertInDevMode(() => {

      /**
       * We warn of trying to destroy a resource item that hasn't actually been confirmed as existing on the
       * remote API yet
       */
      if (currentItem.status.type === NEW) {
        warn(
          `${type}'s key '${key}' matched a new item. Use clearNewItem() ` +
          'to clear items that haven\'t been saved to the server. (Destroy request was still sent to the server.)'
        );
      }

      /**
       * We warn of multiple attempts to destroy the same resource before we know the result of the earlier
       * requests
       */
      if (currentItem.status.type === DESTROYING) {
        warn(`${type}'s key '${key}' matched a new item that has a pending DESTROY action. (Duplicate destroyItem request was still sent to the server.)`);
      }
    });

    return {
      ...resources,
      items: {
        ...resources.items,
        [key]: {
          ...currentItem,

          /**
           * We persist the syncedAt attribute of the item if it's been fetched in the past, in case
           * the request fails, we know the last time it was successfully retrieved.
           */
          status: mergeStatus(currentItem.status, { type: status, requestedAt }, { onlyPersist: ['syncedAt'] })
        }
      }
    };
  } else if (status === SUCCESS) {

    /**
     * Upon the successful deletion of the resource (as confirmed by the external API) we remove it from the
     * Redux store, and any lists or associated resources that it may have appeared in.
     */
    return removeItemsFromResources(resources, key);
  } else if (status === DESTROY_ERROR) {
    return {
      ...resources,
      items: {
        ...resources.items,
        [key]: {
          ...currentItem,
          ...item,
          status: mergeStatus(currentItem.status, item.status)
        }
      }
    };
  } else {
    return resources;
  }
}

/**
 * Handles updating <i>associated</i> resources when the primary one is destroyed
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the <i>associated</i> resources item
 * @returns {ResourcesReduxState} The new resource state
 */
function hasManyAssociationsReducer(resources, { key, type, status, previousValues }, { dependent, relationType, foreignKeyName, name, keyName, listParameter }) {

  if (status === SUCCESS) {
    const _resources = function(){
      if (isEmpty(previousValues)) {

        assertInDevMode(() => {
          warn(
            `${type} did not specify any previous values. This makes updating '${name}.${keyName}' much less ` +
            'efficient. Use the previousValues option for destroyItem() to specify these values.'
          );
        });

        if (dependent === 'destroy') {
          const itemKeysWithDeletedAssociation = Object.keys(resources.items).filter((associationKey) => {
            const item = resources.items[associationKey];

            return contains(item.values[keyName], associationKey, { stringifyFirst: true });
          });

          return removeItemsFromResources(resources, itemKeysWithDeletedAssociation);

        } else {
          return {
            ...resources,
            items: Object.keys(resources.items).reduce((memo, itemKey) => {
              const item = resources.items[itemKey];

              const newValues = function () {
                if (relationType === 'hasAndBelongsToMany') {
                  return {
                    ...item.values,
                    [keyName]: without(item.values[keyName] || [], key)
                  };
                } else {
                  return without(item.values, keyName);
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
        const foreignKeys = arrayFrom(previousValues[foreignKeyName] || previousValues[toPlural(foreignKeyName)]);

        if (dependent === 'destroy') {
          return removeItemsFromResources(resources, foreignKeys);
        } else {

          return {
            ...resources,
            items: {
              ...resources.items,

              ...(foreignKeys.reduce((memo, addedKey) => {
                const item = resources.items[addedKey];

                if (item) {
                  const newValues = function () {
                    if (relationType === 'hasAndBelongsToMany') {
                      return {
                        ...item.values,
                        [keyName]: without(item.values[keyName] || [], key)
                      };
                    } else {
                      return without(item.values, keyName);
                    }
                  }();

                  memo[addedKey] = {
                    ...item,
                    values: newValues
                  };
                }

                return memo;
              }, {}))
            }
          };
        }

      }
    }();

    if (listParameter === false) {

      /**
       * Allow disabling removal of matching lists by passing false to the
       * listParameter option
       */
      return _resources;

    } else {
      const listParameterString = serializeKey({ [listParameter || toSingular(keyName)]: key });

      const lists = Object.keys(_resources.lists).reduce((memo, listKey) => {
        if (!contains(listKey, listParameterString)) {
          memo[listKey] = _resources.lists[listKey];
        }

        return memo;
      }, {});

      return {
        ..._resources,
        lists
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
