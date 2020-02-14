import getItemKey from '../../action-creators/helpers/getItemKey';
import { ITEM, NEW } from '../..';
import applyTransforms from '../../reducers/helpers/applyTransforms';
import extractCollectionOperations from '../../action-creators/helpers/extractCollectionOperations';
import assertInDevMode from '../../utils/assertInDevMode';
import warn from '../../utils/dev/warn';
import applyCollectionOperators from '../../reducers/helpers/applyCollectionOperators';
import without from '../../utils/collection/without';

/**************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

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

function clearActionCreator({ action }) {
  return { type: action };
}


/**************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

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
