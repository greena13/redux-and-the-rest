import getItemKey from '../../action-creators/helpers/getItemKey';
import generateUrl from '../../action-creators/helpers/generateUrl';
import wrapInObject from '../../utils/object/wrapInObject';
import extractCollectionOperations from '../../action-creators/helpers/extractCollectionOperations';
import makeRequest from '../../action-creators/helpers/makeRequest';
import { COLLECTION, ITEM } from '../../constants/DataStructures';
import { CREATING, ERROR, NEW, SUCCESS } from '../../constants/Statuses';
import assertInDevMode from '../../utils/assertInDevMode';
import warn from '../../utils/dev/warn';
import applyCollectionOperators from '../../reducers/helpers/applyCollectionOperators';
import without from '../../utils/collection/without';
import replace from '../../utils/collection/replace';
import applyTransforms from '../../reducers/helpers/applyTransforms';
import processActionCreatorOptions from '../../action-creators/helpers/processActionCreatorOptions';
import internalGetItem from '../../utils/internalGetItem';
import getActionCreatorNameFrom from '../../action-creators/helpers/getActionCreatorNameFrom';

/**************************************************************************************************************
 * Action creator thunk
 ***************************************************************************************************************/

/**
 * Redux action creator used for sending a CREATE request to a RESTful API endpoint
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} paramsOrValues The first argument which can either a string or object that is serialized
 *        and used to fill in the dynamic parameters of the resource's URL (params) or the attribute values to
 *        use to create the resource.
 * @param {Object} valuesOrActionCreatorOptions Either be the values used by the action creator, or addition
 *        options passed to the action creator when it is called.
 * @param {Object} optionalActionCreatorOptions=undefined The optional additional options passed to the action controller.
 * @returns {Thunk}
 */
function actionCreator(options, paramsOrValues, valuesOrActionCreatorOptions, optionalActionCreatorOptions) {
  const { params, values, actionCreatorOptions } = processActionCreatorOptions(
    paramsOrValues,
    valuesOrActionCreatorOptions,
    optionalActionCreatorOptions
  );

  const {
    action,
    transforms,
    url: urlTemplate,
    urlOnlyParams,
    keyBy,
    progress,
    projection
  } = options;

  const key = function(){
    const specifiedKey = getItemKey([params, values], { keyBy });

    if (specifiedKey) {
      return specifiedKey;
    } else {
      /**
       * We automatically generate a new temporary Id if one is not specified
       */
      return Date.now().toString();
    }
  }();

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
 * Redux action creator used for creating a request item in the Redux store without sending any requests to an
 * external API
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} paramsOrValues The first argument which can either a string or object that is serialized
 *        and used to fill in the dynamic parameters of the resource's URL (params) or the attribute values to
 *        use to create the resource.
 * @param {Object} valuesOrActionCreatorOptions Either be the values used by the action creator, or addition
 *        options passed to the action creator when it is called.
 * @param {Object} optionalActionCreatorOptions=undefined The optional additional options passed to the
 *        action controller.
 * @returns {Object} Action Object that will be passed to the reducers to update the Redux state
 */
function localActionCreator(options, paramsOrValues, valuesOrActionCreatorOptions, optionalActionCreatorOptions) {
  const { params, values, actionCreatorOptions } = processActionCreatorOptions(
    paramsOrValues,
    valuesOrActionCreatorOptions,
    optionalActionCreatorOptions
  );

  return receiveCreatedResource({ ...options, params }, actionCreatorOptions, values);
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
  const { action, keyBy, transforms, params, collectionOperations, localOnly } = options;

  const key = function(){
    const specifiedKey = getItemKey([params, values], { keyBy });

    if (specifiedKey) {
      return specifiedKey;
    } else {
      const actionCreatorName = getActionCreatorNameFrom(action);

      assertInDevMode(() => {
        warn(
          `${actionCreatorName}() did not specify a temporary key. One has been generated and stored in ` +
          'newItemKey, but unless you save a reference to it, it will be lost when you create the next item. ' +
          'It\'s therefore recommended when using the localOnly option to always specify a key by passing it ' +
          `as the first argument to ${actionCreatorName}.`
        );
      });

      /**
       * We automatically generate a new temporary Id if one is not specified
       */
      return Date.now().toString();
    }
  }();

  return {
    type: action,
    status: SUCCESS,
    key,
    temporaryKey: options.key,
    collectionOperations,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      values,
      status: { type: SUCCESS, syncedAt: Date.now() }
    }),
    localOnly
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
function reducer(resources, { localOnly, type, temporaryKey, key, collectionOperations = {}, status, item, httpCode, error }) {
  const { items } = resources;
  const currentItem = items[temporaryKey] || ITEM;

  if (status === CREATING) {
    assertInDevMode(() => {
      if (currentItem.status.type && currentItem.status.type !== NEW) {
        warn(
          `${type} has the same key '${temporaryKey}' as an existing item. ` +
          `Use ${getActionCreatorNameFrom(type, { replaceVerb: 'update' })}() to update an existing item, ` +
          'or ensure the new item has a unique temporary key. (The create request was still sent to the server.)'
        );
      }
    });

    /**
     * If the newItemKey points to a resource item of type NEW, then we clear it, to be replaced by the resource
     * item that is now being created.
     *
     * We can't always clear the item pointed to by newItemKey because this attribute is used to point to
     * resource items after they have been created. So if if we created two items one after another, the first
     * would be removed from the store when the second was created.
     */
    const itemsToPersist = function(){
      if (internalGetItem(resources, resources.newItemKey).status.type === NEW) {
        return without(items, resources.newItemKey);
      } else {
        return items;
      }
    }();

    /**
     * If a new resource is being added to the store as CREATING (we're waiting for a remote API to confirm its
     * creation), we add it to the repository of items with a temporary id until a permanent one can assigned
     * by a remote API.
     */
    const newItems = {
      ...itemsToPersist,
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
    const itemsToPersist = function(){
      if (localOnly && internalGetItem(resources, resources.newItemKey).status.type === NEW) {
        /**
         * When in localOnly mode, there is no remote API call, so the CREATING step is skipped and the SUCCESS
         * is the first to happen. If so, we check if there is an existing resource item in the NEW status, and
         * clear it, so when a user NEWs a resource and then CREATEs it and doesn't specify a temporary
         * id (leaving one to be automatically generated each time), the original NEW resource item is properly
         * cleaned up.
         */
        return without(items, resources.newItemKey);
      } else {
        /**
         * Once the remote API has confirmed the creation of the new resource item (and assigned it a permanent id),
         * we replace the one in the local Redux store with the values the remote API sends back in the response,
         * and we index them under the new permanent id.
         */
        return without(items, temporaryKey);
      }
    }();

    const newItems = {
      ...itemsToPersist,
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
  localActionCreator
};
