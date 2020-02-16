import getItemKey from '../../action-creators/helpers/getItemKey';
import generateUrl from '../../action-creators/helpers/generateUrl';
import wrapInObject from '../../utils/object/wrapInObject';
import makeRequest from '../../action-creators/helpers/makeRequest';
import assertInDevMode from '../../utils/assertInDevMode';
import warn from '../../utils/dev/warn';
import { DESTROY_ERROR, DESTROYING, NEW, SUCCESS } from '../../constants/Statuses';
import { ITEM } from '../../constants/DataStructures';
import removeItemsFromResources from '../../reducers/helpers/removeItemsFromResources';
import isEmpty from '../../utils/collection/isEmpty';
import applyTransforms from '../../reducers/helpers/applyTransforms';
import getActionCreatorNameFrom from '../../action-creators/helpers/getActionCreatorNameFrom';

/**************************************************************************************************************
 * Action creator thunk
 ***************************************************************************************************************/

/**
 * Redux action creator used for destroying a resource item by making a DELETE request to a RESTful API endpoint
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} params A string or object that is serialized and used to fill in the dynamic parameters
 *        of the resource's URL
 * @param {Object} actionCreatorOptions={} The options passed to the action creator when it is called.
 * @returns {Thunk}
 */
function actionCreator(options, params, actionCreatorOptions = {}) {
  const {
    action,
    name,
    keyBy,
    url: urlTemplate,
    progress
  } = options;

  const normalizedParams = wrapInObject(params, keyBy);

  const key = getItemKey(normalizedParams, { keyBy });
  const url = generateUrl({ url: urlTemplate, name }, normalizedParams);

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

/**************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Creates an action object to update the Redux store to list a resource item as DELETING (waiting for the
 * remote API to confirm it's been deleted)
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} values The values of the resource item that is being deleted, used to more efficiently remove
 *        the item from any associated resource collections it may appear in.
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function deleteResourceUpdate(options, values) {
  const { action, key } = options;

  return {
    type: action,
    status: DESTROYING, key,
    previousValues: isEmpty(values) ? null : values
  };
}

/**
 * Redux action creator used for removing a resource item from the Redux store without making a DELETE request
 * to a RESTful API endpoint
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} params A string or object that is serialized and used to fill in the dynamic parameters
 *        of the resource's URL
 * @param {Object} actionCreatorOptions={} The options passed to the action creator when it is called.
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function localActionCreator(options, params, actionCreatorOptions = {}){
  const { keyBy } = options;
  const normalizedParams = wrapInObject(params, keyBy);

  const key = getItemKey(normalizedParams, { keyBy });

  return removeResource({ ...options, key }, actionCreatorOptions);
}
/**
 * Creates an action object to update the Redux store remove a resource item after it has been confirmed as
 * deleted by a remote API
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} previousValues The values of the resource item that is being deleted, used to more
 *        efficiently remove the item from any associated resource collections it may appear in.
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function removeResource(options, previousValues) {
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
 * @param {object} error An object containing the details of the error
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function handleDestroyResourceError(options, actionCreatorOptions, httpCode, error) {
  const { transforms, action, key } = options;

  return {
    type: action,
    status: DESTROY_ERROR, key,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      status: {
        type: DESTROY_ERROR,
        httpCode,
        error
      },
    })
  };
}

/**************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

/**
 * Handles reducing a resource item in a Redux store as it moves through the stages of it deletion
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources item
 * @param {ActionObject} action The action containing the data to update the resource state
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, { type, status, key, item }) {
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
        const actionCreatorName = getActionCreatorNameFrom(type, { replaceVerb: 'clearNew' });

        warn(
          `${type}'s key '${key}' matched a new item. Use ${actionCreatorName}() ` +
          'to clear items that haven\'t been saved to the server. (Destroy request was still sent to the server.)'
        );
      }

      /**
       * We warn of multiple attempts to destroy the same resource before we know the result of the earlier
       * requests
       */
      if (currentItem.status.type === DESTROYING) {
        warn(`${type}'s key '${key}' matched a new that has a pending DESTROY action. (Duplicate destroy request was still sent to the server.)`);
      }
    });

    return {
      ...resources,
      items: {
        ...resources.items,
        [key]: {
          ...currentItem,
          status: {
            type: status
          }
        }
      }
    };
  } else if (status === SUCCESS) {
    /**
     * Upon the successful deletion of the resource (as confirmed by the external API) we remove it from the
     * Redux store, and any collections or associated resources that it may have appeared in.
     */
    return removeItemsFromResources(resources, key);
  } else if (status === DESTROY_ERROR) {
    return {
      ...resources,
      items: {
        ...resources.items,
        [key]: {
          ...currentItem,
          ...item
        }
      }
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
