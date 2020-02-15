import getItemKey from '../../action-creators/helpers/getItemKey';
import { ITEM } from '../../constants/DataStructures';
import { NEW } from '../../constants/Statuses';
import applyTransforms from '../../reducers/helpers/applyTransforms';
import extractCollectionOperations from '../../action-creators/helpers/extractCollectionOperations';
import assertInDevMode from '../../utils/assertInDevMode';
import warn from '../../utils/dev/warn';
import applyCollectionOperators from '../../reducers/helpers/applyCollectionOperators';
import without from '../../utils/collection/without';

/**************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Redux action creator used for adding a new resource item to the Redux store WITHOUT sending it to a remote API
 * (yet). This action is used for storing a new resource item locally before actually creating it
 * (which sends the new attributes to the remote API).
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} params A string or object that is serialized and used to fill in the dynamic parameters
 *        of the resource's URL
 * @param {Object} values The new attribute values to merge into the exist ones of the new resource item, or to
 *        use to create the resource item for the first time.
 * @param {Object} actionCreatorOptions={} The options passed to the action creator when it is called.
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function actionCreator(options, params, values = {}, actionCreatorOptions = {}) {
  const { action, transforms, keyBy, urlOnlyParams } = options;

  const temporaryKey = getItemKey(params, { keyBy });

  return {
    type: action,
    status: NEW,
    temporaryKey,
    collectionOperations: extractCollectionOperations(actionCreatorOptions, urlOnlyParams),
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      ...ITEM,
      values,
      status: { type: NEW },
    }),
  };
}

/**
 * Redux action creator used for clearing the new resource.
 * @param action
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function clearActionCreator({ action }) {
  return { type: action };
}

/**************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

/**
 * Handles reducing a resource item in a Redux store as it's created, before being sent to a remote API.
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources
 * @param {ActionObject} action The action containing the data to use to create or refine the new resource item
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, { type, temporaryKey, item, collectionOperations }) {
  assertInDevMode(() => {
    const existingItem = resources.items[temporaryKey];

    if (existingItem) {
      if (resources.newItemKey === temporaryKey) {
        warn(`'${type}' has same key '${temporaryKey}' as the previous new item, which has not finished saving to the server. If you wish to create new items before the previous ones have finished saving, ensure you use unique temporary keys. If you want to discard the previous item, use the clearNew*() action. (Previous item was overridden with new values.)`);
      } else {
        warn(`'${type}' has same key '${temporaryKey}' as existing item, use edit*() to update it instead, or clearNew*() if you want to discard the previous values. (Previous item was overridden with new values.)`);
      }
    }
  });

  const newItems = {
    ...resources.items,
    [temporaryKey]: {
      ...item,
    }
  };

  return {
    ...resources,
    items: newItems,
    collections: applyCollectionOperators(resources.collections, collectionOperations, temporaryKey),
    newItemKey: temporaryKey
  };
}

/**
 * Handles reducing clearing the new resource item in a Redux store
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources
 * @returns {ResourcesReduxState} The new resource state
 */
function clearReducer(resources) {
  const { newItemKey, items, collections, selectionMap } = resources;

  if (items[newItemKey] && items[newItemKey].status.type === NEW) {
    return {
      ...resources,
      items: without(items, newItemKey),
      collections: Object.keys(collections).reduce((memo, key) => {
        const collection = collections[key];

        memo[key] = { ...collection, positions: without(collection.positions, newItemKey) };

        return memo;
      }, {} ),
      selectionMap: without(selectionMap, newItemKey),
      newItemKey: null,
    };
  } else {
    return {
      ...resources,
      newItemKey: null,
    };
  }
}


export default {
  reducer,
  clearReducer,
  actionCreator,
  clearActionCreator
};
