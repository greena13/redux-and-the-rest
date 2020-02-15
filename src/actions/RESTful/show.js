import getItemKey from '../../action-creators/helpers/getItemKey';
import generateUrl from '../../action-creators/helpers/generateUrl';
import makeRequest from '../../action-creators/helpers/makeRequest';
import { ERROR, FETCHING, SUCCESS } from '../../constants/Statuses';
import { ITEM } from '../../constants/DataStructures'

import applyTransforms from '../../reducers/helpers/applyTransforms';

/**************************************************************************************************************
 * Action creator thunk
 ***************************************************************************************************************/

/**
 * Redux action creator used for fetching a single resource item from a show RESTful API endpoint
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} params A string or object that is serialized and used to fill in the dynamic parameters
 *        of the resource's URL
 * @param {Object} actionCreatorOptions={} The options passed to the action creator when it is called.
 * @returns {Thunk}
 */
function actionCreator(options, params, actionCreatorOptions = { }) {
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

/**************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Creates an action object to update the Redux store to list a resource item as FETCHING
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions Options passed to the action creator
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function requestResource(options, actionCreatorOptions) {
  const { transforms, action, key } = options;

  return {
    type: action,
    status: FETCHING,
    key,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      ...ITEM,
      values: { },
      status: { type: FETCHING }
    })
  };
}

/**
 * Creates an action object to update the Redux store to list a resource item as successfully received from
 * an external API
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions Options passed to the action creator
 * @param {Object} values The attributes of the resource item
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function receiveResource(options, actionCreatorOptions, values) {
  const { transforms, action, params, keyBy, projection } = options;

  const item = applyTransforms(transforms, options, actionCreatorOptions, {
    ...ITEM,
    values,
    status: { type: SUCCESS, syncedAt: Date.now() },
    projection
  });

  return {
    type: action,
    status: SUCCESS,
    key: getItemKey([params, item.values], { keyBy }),
    item
  };
}

/**
 * Creates an action object to update the Redux store to mark a resource item as errored when it was
 * requested from an external API
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions Options passed to the action creator
 * @param {number} httpCode The HTTP status code of the error response
 * @param {object} error An object containing the details of the error
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function handleResourceError(options, actionCreatorOptions, httpCode, error) {
  const { action, key, projection } = options;

  return {
    type: action,
    status: ERROR,
    projection,
    httpCode,
    key,
    error
  };
}

/**************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/


/**
 * Handles reducing a resource item in a Redux store as it moves through its lifecycle events
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources
 * @param {ActionObject} action The action containing the data to update the resource state
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, { status, key, error, httpCode, item }) {

  /**
   * Fetch the current values for the resource if they are already in the store, otherwise fallback to an
   * empty resource item
   */
  const currentItem = resources.items[key] || ITEM;

  if (status === FETCHING) {
    if (currentItem.status.type === SUCCESS) {
      /**
       * When a resource item is being fetched and that resource already exists in the store - i.e. we are
       * re-retrieving it from the external APi - then we persist the values already in the store and update the
       * rest of the item's information, such as its state and projection.
       *
       * This allows use to move between projections of less data to more data (e.g. a PREVIEW to a FULL)
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
            }
          }
        }
      };

    } else {
      /**
       * When a resource item is being fetched and it does NOT already exist in the store, we simply take the
       * entire set of attributes of the item (including its values, state and projection) and add them to the
       * store.
       */

      return {
        ...resources,
        items: {
          ...resources.items,
          [key]: item
        }
      };
    }

  } else if (status === SUCCESS) {
    /**
     * When a resource item has been successfully fetched, we merge the item's current status information with
     * the action's new status information and then allow the new item values to override whatever is already
     * in the store.
     */

    const newStatus = {
      ...currentItem.status,
      ...item.status
    };

    return {
      ...resources,
      items: {
        ...resources.items,
        [key]: {
          ...item,
          status: newStatus
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
          status: {
            type: status,
            httpCode,
            error
          }
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
