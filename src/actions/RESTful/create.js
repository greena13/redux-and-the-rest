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

function submitCreateResource(options, actionCreatorOptions, values, collectionOperations) {
  const { transforms, action, key } = options;

  return {
    type: action,
    status: CREATING,
    temporaryKey: key, collectionOperations,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      ...ITEM,
      values,
      status: { type: CREATING }
    })
  };
}

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

function reducer(resources, { type, temporaryKey, key, collectionOperations = {}, status, item, httpCode, error }) {
  const { items } = resources;
  const currentItem = items[temporaryKey] || ITEM;

  if (status === CREATING) {
    assertInDevMode(() => {
      if (currentItem.status.type && currentItem.status.type !== NEW) {
        warn(`${type} has the same key '${temporaryKey}' as an existing item. Use update*() to update an existing item, or ensure the new item has a unique temporary key. (The create request was still sent to the server.)`);
      }
    });

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
      collections: applyCollectionOperators(resources.collections, collectionOperations, temporaryKey),
      newItemKey: temporaryKey
    };

  } else if (status === SUCCESS) {
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
