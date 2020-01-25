import {
  FETCHING,
  NEW,
  UPDATING,
  CREATING,
  SUCCESS, DESTROYING, ERROR, DESTROY_ERROR
} from '../constants/Statuses';

import { ITEM, RESOURCES, COLLECTION } from '../constants/DataStructures';
import without from '../utils/collection/without';
import isObject from '../utils/object/isObject';
import warn from '../utils/dev/warn';
import assertInDevMode from '../utils/assertInDevMode';
import arrayFrom from '../utils/array/arrayFrom';
import replace from '../utils/collection/replace';
import addAssociationReducer from './helpers/addAsssociationReducer';
import removeItemsFromResources from './helpers/removeItemsFromResources';
import resolveOptions from '../action-creators/helpers/resolveOptions';
import progressReducer from './helpers/progressReducer';
import { getConfiguration } from '../configuration';
import standardiseAssociationOptions from '../utils/standardiseAssociationOptions';

function setCollection(resources, { status, items, key, httpCode, collection, error }) {
  const currentList = resources.collections[key] || COLLECTION;

  if (status === FETCHING) {
    return {
      ...resources,
      collections: {
        ...resources.collections,
        [key]: {
          ...currentList,
          status: collection.status
        }
      }
    };
  } else if( status === SUCCESS) {
    const newItems = {
      ...resources.items,
      ...items,
    };

    const newStatus = {
      ...currentList.status,
      ...collection.status
    };

    const newLists = {
      ...resources.collections,
      [key]: {
        ...collection,
        status: newStatus
      }
    };

    return {
      ...resources,
      items: newItems,
      collections: newLists,
    };

  } else if (status === ERROR) {

    const newLists = {
      ...resources.collections,
      [key]: {
        ...currentList,
        status: {
          type: status,
          httpCode,
          error,
        }
      }
    };

    return {
      ...resources,
      collections: newLists
    };

  } else {
    return resources;
  }

}

function setItem(resources, { status, key, error, httpCode, item }) {

  const currentItem = resources.items[key] || ITEM;

  if (status === FETCHING) {

    if (currentItem.status.type === SUCCESS) {
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
      return {
        ...resources,
        items: {
          ...resources.items,
          [key]: item
        }
      };
    }

  } else if (status === SUCCESS) {
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

function selectItem(resources, { type, key, context }) {

  if (resources.items[key]) {
    return {
      ...resources,
      selectionMap: {
        [key]: context
      }
    };
  } else {
    warn(`selectMap is not intended to hold references to items that are not in the store. ${type}'s key '${key}' did not match any of the item keys: ${Object.keys(resources.items).join(', ')}. Check the options passed to select*(). (The selection was ignored.)`);

    return resources;
  }
}

function selectAnotherItem(resources, { type, key, context }) {

  if (resources.items[key]) {
    return {
      ...resources,
      selectionMap: {
        ...resources.selectionMap,
        [key]: context
      }
    };
  } else {
    warn(`selectMap is not intended to hold references to items that are not in the store. ${type}'s key '${key}' did not match any of the item keys: ${Object.keys(resources.items).join(', ')}. Check the options passed to selectAnother*(). (The selection was ignored.)`);

    return resources;
  }

}

function deselectItem(resources, { key }) {

  return {
    ...resources,
    selectionMap: without(resources.selectionMap, key)
  };
}

function clearSelectedItems(resources) {
  return {
    ...resources,
    selectionMap: {}
  };
}

function applyCollectionOperators(collections, collectionOperations = {}, temporaryKey) {
  const updatedCollections = {};

  collectionOperations.push.forEach((collectionKey) => {
    const existingCollection = collections[collectionKey] || COLLECTION;

    updatedCollections[collectionKey] = {
      ...existingCollection,
      positions: [
        ...existingCollection.positions,
        temporaryKey
      ]
    };
  });

  collectionOperations.unshift.forEach((collectionKey) => {
    const existingCollection = collections[collectionKey] || COLLECTION;

    updatedCollections[collectionKey] = {
      ...existingCollection,
      positions: [
        temporaryKey,
        ...existingCollection.positions
      ]
    };
  });

  collectionOperations.invalidate.forEach((collectionKey) => {
    updatedCollections[collectionKey] = COLLECTION;
  });

  return {
    ...collections,
    ...updatedCollections
  };
}

function addNewItem(resources, { type, temporaryKey, item, collectionOperations }) {

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

function clearNewItem(resources) {
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

function createNewItem(resources, { type, temporaryKey, key, collectionOperations = {}, status, item, httpCode, error }) {
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

function editItem(resources, { type, key, item }) {
  const { items } = resources;

  assertInDevMode(() => {
    if (!items[key]) {
      warn(`${type}'s key '${key}' does not match any items in the store. Use a new*() to create a new item or check the arguments passed to edit*(). (A new item was created to contain the edit.)`);
    }
  });

  const currentItem = items[key] || ITEM;

  const newValues = {
    ...currentItem.values,
    ...item.values
  };

  return {
    ...resources,
    items: {
      ...items,
      [key]: {
        ...item,
        values: newValues,
      }
    }
  };

}

function updateItem(resources, { type, key, status, item, httpCode, error }) {
  const { items } = resources;

  assertInDevMode(() => {
    if (!items[key]) {
      warn(`${type}'s key '${key}' did not match any items in the store. Check the arguments passed to update*(). (Update request still sent to the server.)`);
    } else if (items[key].status.type === NEW) {
      warn(`${type}'s key '${key}' matched a new resource. Use edit*() to modify an item that has not been saved to the server yet. (Update request still sent to the server.)`);
    }
  });

  const currentItem = items[key] || ITEM;

  if (status === UPDATING) {
    const newValues = {
      ...currentItem.values,
      ...item.values
    };

    const newItems = {
      ...items,
      [key]: {
        ...item,
        values: newValues,
      }
    };

    return {
      ...resources,
      items: newItems,
    };

  } else if (status === SUCCESS) {
    const newValues = {
      ...currentItem.values,
      ...item.values
    };

    const newStatus = {
      ...currentItem.status,
      ...item.status
    };

    const newItems = {
      ...items,
      [key]: {
        ...item,
        values: newValues,
        status: newStatus
      }
    };

    return {
      ...resources,
      items: newItems,
    };

  } else if (status === ERROR) {

    const newItems = {
      ...items,
      [key]: {
        ...items[key],
        status: {
          type: status,
          httpCode,
          error
        }
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

function removeItem(resources, { type, status, key, item }) {
  assertInDevMode(() => {
    if (!resources.items[key]) {
      warn(`${type}'s key '${key}' did not match any items in the store. (Destroy request was still sent to the server.)`);
    }
  });

  const currentItem = resources.items[key] || ITEM;

  if (status === DESTROYING) {
    assertInDevMode(() => {
      if (currentItem.status.type === NEW) {
        warn(`${type}'s key '${key}' matched a new item. Use clearNew*() to clear items that haven't been saved to the server. (Destroy request was still sent to the server.)`);
      }

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

function clearResources() {
  return RESOURCES;
}

/**
 * Dictionary of standard reducer functions for keeping the local store synchronised with a remote RESTful API.
 */
const STANDARD_REDUCERS = {
  index: setCollection,
  show: setItem,
  select: selectItem,
  selectAnother: selectAnotherItem,
  deselect: deselectItem,
  clearSelected: clearSelectedItems,
  new: addNewItem,
  clearNew: clearNewItem,
  create: createNewItem,
  edit: editItem,
  update: updateItem,
  destroy: removeItem,
  clear: clearResources,
};

/**
 * Dictionary or reducer functions to use when the localOnly option is set, causing changes to be performed
 * synchronously, without any requests being made to an external API.
 */
const LOCAL_ONLY_REDUCERS = {
  ...STANDARD_REDUCERS,
  create: setItem,
  update: setItem
};

const PROGRESS_COMPATIBLE_ACTIONS = {
  index: true,
  show: true,
  update: true,
  create: true
};

/**
 * @callback ReducerFunction Function that accepts the current state and Redux action and returns the
 *          correct new state.
 * @param {ResourcesReduxState} currentState The current state of there resource
 * @param {ActionObject} action The action containing the data to update the resource state
 * @returns {ResourcesReduxState} The new resource state
 */

/**
 * Creates the reducer function can be used to correctly update a resource's state after every Redux action that
 * is dispatched.
 * @param {ResourceOptions} resourceOptions Hash of actionsOptions for configuring the resource
 * @param {ActionsDictionary} actionsDictionary Dictionary of actions available for the resource
 * @param {ActionOptions} actionsOptions Hash of actionsOptions for configuring the actions that be dispatched to
 *        modify the resource
 * @returns {ReducerFunction} Reducer function that will accept the resource's current state and an action
 *          and return the new resource state
 */
function buildReducers(resourceOptions, actionsDictionary, actionsOptions) {

  /**
   * Build the map of actions that should effect the current resource
   */

  const configuration = getConfiguration();

  /**
   * We use a different set of reducers when the localOnly option is used (to perform updates synchronously
   * without making any requests to a remote API).
   */
  const effectiveReducers = resourceOptions.localOnly ? LOCAL_ONLY_REDUCERS : STANDARD_REDUCERS;

  const reducersDict = Object.keys(actionsOptions).reduce((memo, key) => {
    const actionOptions = actionsOptions[key];
    const reducer = (isObject(actionOptions) && actionOptions.reducer) || effectiveReducers[key];

    if (reducer) {
      const reducerOptions = resolveOptions(
        {
          beforeReducers: [],
          afterReducers: [],
        },
        configuration,
        resourceOptions,
        actionOptions,
        [
          'progress',
          'beforeReducers',
          'afterReducers',
        ]
      );

      if (reducerOptions.progress && (!STANDARD_REDUCERS[key] || PROGRESS_COMPATIBLE_ACTIONS[key])) {
        reducerOptions.beforeReducers = [
          ...reducerOptions.beforeReducers,
          key === 'index' ? (resources, action) => progressReducer(resources, action, 'collections') : progressReducer
        ];
      }

      const _reducer = function(){
        if (reducerOptions.beforeReducers.length > 0 || reducerOptions.afterReducers.length > 0) {
          return (resources, action) => {
            let _resources = resources;

            reducerOptions.beforeReducers.forEach((beforeReducer) => {
              _resources = beforeReducer(_resources, action);
            });

            _resources = reducer(_resources, action);

            reducerOptions.afterReducers.forEach((afterReducer) => {
              _resources = afterReducer(_resources, action);
            });

            return _resources;
          };
        } else {
          return reducer;
        }
      }();

      memo[actionsDictionary.get(key)] = { options: reducerOptions, reducer: _reducer };
    } else {
      warn(`Action '${key}' must match the collection of standard reducers (${Object.keys(STANDARD_REDUCERS).join(', ')}) or define a 'reducer' option.`);
    }

    return memo;
  }, {});

  /**
   * Add actions for which the current resource should be cleared
   */

  arrayFrom(resourceOptions.clearOn).forEach((action) => {
    reducersDict[action] = { reducer: STANDARD_REDUCERS.clear };
  });

  arrayFrom(resourceOptions.reducesOn).forEach(({ action, reducer }) => {
    reducersDict[action] = { reducer };
  });

  /**
   * Actions that update this resources' foreign keys
   */

  if (resourceOptions.hasAndBelongsToMany) {
    Object.keys(resourceOptions.hasAndBelongsToMany).forEach((associationName) => {
      const associationOptions = standardiseAssociationOptions(
        resourceOptions.hasAndBelongsToMany[associationName]
      );

      addAssociationReducer(reducersDict, resourceOptions.name, 'hasAndBelongsToMany', associationName, associationOptions);
    });
  }

  if (resourceOptions.belongsTo) {
    Object.keys(resourceOptions.belongsTo).forEach((associationName) => {
      const associationOptions = standardiseAssociationOptions(
        resourceOptions.belongsTo[associationName]
      );

      addAssociationReducer(reducersDict, resourceOptions.name, 'belongsTo', associationName, associationOptions);
    });
  }

  return (resource = RESOURCES, action = {}) => {
    const { type } = action;

    const actionReducer = reducersDict[type];

    if (actionReducer) {
      return actionReducer.reducer(resource, action);
    } else {
      return resource;
    }
  };
}

export default buildReducers;
