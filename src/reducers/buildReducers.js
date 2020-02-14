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


/**
 * Handles reducing a resource collection in a Redux store as it moves through its lifecycle events
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources
 * @param {ActionObject} action The action containing the data to update the resource state
 * @returns {ResourcesReduxState} The new resource state
 */
function setCollection(resources, { status, items, key, httpCode, collection, error }) {
  const currentList = resources.collections[key] || COLLECTION;

  if (status === FETCHING) {
    /**
     * When a collection is being fetched, we simply update the collection's status and projection values,
     * leaving any items in the collection that are already there untouched.
     *
     * Note that we completely override the projection object with the new values - we dont' merge it.
     */

    return {
      ...resources,
      collections: {
        ...resources.collections,
        [key]: {
          ...currentList,
          status: collection.status,
          projection: collection.projection
        }
      }
    };
  } else if(status === SUCCESS) {
    /**
     * When a collection has been successfully fetched, we merge the items contained in the API's response
     * body with those already in the store. This allows us to work with pagination and fetch more items on
     * the next "page" of the collection.
     */

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

    /**
     * When the attempt to fetch a collection from the API results in an error, we leave the current contents
     * of the collection and update its state and projection to reflect the details of the error.
     */
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

/**
 * Handles reducing a resource item in a Redux store as it moves through its lifecycle events
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources
 * @param {ActionObject} action The action containing the data to update the resource state
 * @returns {ResourcesReduxState} The new resource state
 */
function setItem(resources, { status, key, error, httpCode, item }) {

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

function selectItem(resources, { type, key, value }) {

  if (resources.items[key]) {
    return {
      ...resources,
      selectionMap: {
        [key]: value
      }
    };
  } else {
    warn(`selectMap is not intended to hold references to items that are not in the store. ${type}'s key '${key}' did not match any of the item keys: ${Object.keys(resources.items).join(', ')}. Check the options passed to select*(). (The selection was ignored.)`);

    return resources;
  }
}

function selectAnotherItem(resources, { type, key, value }) {

  if (resources.items[key]) {
    return {
      ...resources,
      selectionMap: {
        ...resources.selectionMap,
        [key]: value
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
  /**
   * RESTful actions
   */
  index: setCollection,
  show: setItem,
  new: addNewItem,
  create: createNewItem,
  edit: editItem,
  update: updateItem,
  destroy: removeItem,

  /**
   * Clear actions
   */
  clear: clearResources,
  clearNew: clearNewItem,

  /**
   * Selection actions
   */
  select: selectItem,
  selectAnother: selectAnotherItem,
  deselect: deselectItem,
  clearSelected: clearSelectedItems
};

/**
 * Dictionary of RESTful actions that have progress events
 * @type {Object<string, boolean>}
 */
const PROGRESS_COMPATIBLE_ACTIONS = {
  index: true,
  show: true,
  update: true,
  create: true
};

function getProgressReducer(key) {
  if (key === 'index') {
    return (resources, action) => progressReducer(resources, action, 'collections');
  } else {
    return progressReducer;
  }
}

/**
 * Dictionary or reducer functions to use when the localOnly option is set, causing changes to be performed
 * synchronously, without any requests being made to an external API.
 */
const LOCAL_ONLY_REDUCERS = {
  ...without(STANDARD_REDUCERS, Object.keys(PROGRESS_COMPATIBLE_ACTIONS)),
  create: setItem,
  update: setItem
};

/**
 * Function that accepts the current state and Redux action and returns the correct new state.
 * @callback ReducerFunction
 * @param {ResourcesReduxState} currentState The current state of the part of the Redux store that contains
 *        the resources
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

  /**
   * Iterate over the list of defined actions, creating the corresponding reducer and storing it in a map to
   * be retrieved and called each time the action occurs
   */
  const reducersDict = Object.keys(actionsOptions).reduce((memo, key) => {
    const actionOptions = actionsOptions[key];

    /**
     * Allow overriding the default reducer (or specifying a reducer for a custom action) otherwise default
     * to the standard reducer
     */
    const reducer = (isObject(actionOptions) && actionOptions.reducer) || effectiveReducers[key];

    if (!reducer) {

      if (resourceOptions.localOnly && STANDARD_REDUCERS[key]) {
        warn(`Action '${key}' is not compatible with the localOnly option.`);
      } else {
        const standardReducersList = Object.keys(STANDARD_REDUCERS).join(', ');

        warn(`Action '${key}' must match the collection of standard reducers (${standardReducersList}) or define a 'reducer' option.`);
      }
    } else {
      /**
       * Construct the correct reducer options, merging the those specified (in order of precedence):
       * - In the individual action definitions passed to the resource function ("Action options")
       * - Using the general options passed to the resources function ("Resource options"
       * - Using the configure function ("Global options")
       *
       * These options can still be overridden by options passed to the action creator each time it's called
       */
      const reducerOptions = resolveOptions(
        /**
         * List of objects to source options from
         */
        { beforeReducers: [], afterReducers: [], }, configuration, resourceOptions, actionOptions,
        /**
         * List of options to pluck
         */
        ['progress', 'beforeReducers', 'afterReducers',]
      );

      /**
       * Set up the additional transform functions required to process progress updates if the progress
       * actions have been enabled.
       */
      if (reducerOptions.progress && (!STANDARD_REDUCERS[key] || PROGRESS_COMPATIBLE_ACTIONS[key])) {
        reducerOptions.beforeReducers = [
          ...reducerOptions.beforeReducers,
          getProgressReducer(key)
        ];
      }

      const _reducer = function(){
        /**
         * If there are additional transform functions to be run before or after the primary reducer
         * enqueue them to run in sequence, passing the result of each to the next
         */
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

      memo[actionsDictionary.get(key)] = {
        options: reducerOptions,
        reducer: _reducer
      };
    }

    return memo;
  }, {});

  /**
   * Add actions for which the current resource should be cleared
   */
  arrayFrom(resourceOptions.clearOn).forEach((action) => {
    reducersDict[action] = { reducer: STANDARD_REDUCERS.clear };
  });

  /**
   * Add actions for which the current resource should call a reducer function
   */
  arrayFrom(resourceOptions.reducesOn).forEach(({ action, reducer }) => {
    reducersDict[action] = { reducer };
  });

  /**
   * Add actions that update this resources' foreign keys
   */
  if (resourceOptions.hasAndBelongsToMany) {
    Object.keys(resourceOptions.hasAndBelongsToMany).forEach((associationName) => {
      const associationOptions = standardiseAssociationOptions(
        resourceOptions.hasAndBelongsToMany[associationName]
      );

      addAssociationReducer(
        reducersDict,
        resourceOptions.name,
        'hasAndBelongsToMany',
        associationName,
        associationOptions
      );
    });
  }

  if (resourceOptions.belongsTo) {
    Object.keys(resourceOptions.belongsTo).forEach((associationName) => {
      const associationOptions = standardiseAssociationOptions(
        resourceOptions.belongsTo[associationName]
      );

      addAssociationReducer(
        reducersDict,
        resourceOptions.name,
        'belongsTo',
        associationName,
        associationOptions
      );
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
