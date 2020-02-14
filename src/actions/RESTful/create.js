import getItemKey from '../../action-creators/helpers/getItemKey';
import generateUrl from '../../action-creators/helpers/generateUrl';
import wrapInObject from '../../utils/object/wrapInObject';
import extractCollectionOperations from '../../action-creators/helpers/extractCollectionOperations';
import makeRequest from '../../action-creators/helpers/makeRequest';
import { COLLECTION, CREATING, ERROR, ITEM, NEW, SUCCESS } from '../..';
import assertInDevMode from '../../utils/assertInDevMode';
import warn from '../../utils/dev/warn';
import applyCollectionOperators from '../../reducers/helpers/applyCollectionOperators';
import without from '../../utils/collection/without';
import replace from '../../utils/collection/replace';
import applyTransforms from '../../reducers/helpers/applyTransforms';

/**************************************************************************************************************
 * Action creator thunk
 ***************************************************************************************************************/

/**
 * Redux action creator used for sending a CREATE request to a RESTful API endpoint
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} params A string or object that is serialized and used to fill in the dynamic parameters
 *        of the resource's URL
 * @param {Object} values The attribute values to use to create the resource
 * @param {Object} actionCreatorOptions={} The options passed to the action creator when it is called.
 * @returns {Thunk}
 */
function actionCreator(options, params, values, actionCreatorOptions = {}) {
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
      onError: handleCreateResourceError,
      progress
    }, actionCreatorOptions);
  };
}

/**************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Creates an action object to update the Redux store to list a new resource item as being created on a remote API
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions={} The options passed to the create* action creator function
 * @param {Object} values The attributes of the resource currently being created
 * @param {Object} collectionOperations={} Options for how the newly created resource should be added to an
 *        existing collections - if any.
 * @returns {Object} Action Object that will be passed to the reducers to update the Redux state
 */
function submitCreateResource(options, actionCreatorOptions, values, collectionOperations) {
  const { transforms, action, key } = options;

  return {
    type: action,
    status: CREATING,
    temporaryKey: key,
    collectionOperations,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      ...ITEM,
      values,
      status: { type: CREATING }
    })
  };
}

/**
 * Creates an action object to update the Redux store to list a resource item as having been confirmed as created
 * by an external API
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions Options passed to the action creator
 * @param {Object} values The values returned by the external API for the newly created resource item
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function receiveCreatedResource(options, actionCreatorOptions, values) {
  const { action, keyBy, transforms, key, params, collectionOperations } = options;

  return {
    type: action,
    status: SUCCESS,
    key: getItemKey([params, values], { keyBy }),
    temporaryKey: key,
    collectionOperations,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      values,
      status: { type: SUCCESS, syncedAt: Date.now() }
    })
  };
}

/**
 * Creates an action object to update the Redux store to mark a resource item as errored when the request to
 * created it on the external API failed
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions Options passed to the action creator
 * @param {number} httpCode The HTTP status code of the error response
 * @param {object} error An object containing the details of the error
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function handleCreateResourceError(options, actionCreatorOptions, httpCode, error) {
  const { action, key } = options;

  return {
    type: action,
    status: ERROR,
    temporaryKey: key,
    httpCode,
    error
  };
}

/**************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

/**
 * Handles reducing a resource item in a Redux store as it moves through the stages of it creation
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources item
 * @param {ActionObject} action The action containing the data to update the resource state
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, { type, temporaryKey, key, collectionOperations = {}, status, item, httpCode, error }) {
  const { items } = resources;
  const currentItem = items[temporaryKey] || ITEM;

  if (status === CREATING) {
    assertInDevMode(() => {
      if (currentItem.status.type && currentItem.status.type !== NEW) {
        warn(`${type} has the same key '${temporaryKey}' as an existing item. Use update*() to update an existing item, or ensure the new item has a unique temporary key. (The create request was still sent to the server.)`);
      }
    });

    /**
     * If a new resource is being added to the store as CREATING (we're waiting for a remote API to confirm its
     * creation), we add it to the repository of items with a temporary id until a permanent one can assigned
     * by a remote API.
     */
    const newItems = {
      ...items,
      [temporaryKey]: {
        ...currentItem,
        ...item
      }
    };

    return {
      ...resources,
      items: newItems,
      /**
       * We add the new item (using its temporary id) to any collections that already exist in the store,
       * that the new item should be a part of - according to the collectionOperations specified.
       */
      collections: applyCollectionOperators(resources.collections, collectionOperations, temporaryKey),
      newItemKey: temporaryKey
    };

  } else if (status === SUCCESS) {
    /**
     * Once the remote API has confirmed the creation of the new resource item (and assigned it a permanent id),
     * we replace the one in the local Redux store with the values the remote API sends back in the response,
     * and we index them under the new permanent id.
     */
    const newItems = {
      ...without(items, temporaryKey),
      [key]: {
        ...item,
        status: {
          ...currentItem.status,
          ...item.status
        }
      }
    };

    return {
      ...resources,
      items: newItems,
      collections: {
        ...resources.collections,
        /**
         * We update an usage of the temporary id in any of the collections the item appeared in, replacing
         * them with the new permanent id
         */
        ...([].concat(...Object.values(collectionOperations))).reduce((memo, id) => {
          const collection = resources.collections[id] || COLLECTION;
          const { positions } = collection;

          memo[id] = {
            ...collection,
            positions: replace(positions, temporaryKey, key)
          };

          return memo;
        }, {})
      },

      newItemKey: key,
    };
  } else if (status === ERROR) {
    /**
     * If the resource item fails to create with the remote API, we leave the resource item where it is, change
     * it's status to ERROR, and merge in any error details
     */
    return {
      ...resources,
      items: {
        ...items,
        [temporaryKey]: {
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
  actionCreator,
  localActionCreator: receiveCreatedResource
};
