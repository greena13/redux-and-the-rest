import { LIST } from '../../constants/DataStructures';
import contains from '../../utils/list/contains';
import { getConfiguration } from '../../configuration';
import without from '../../utils/list/without';
import keysExplicitlyReferencedByListOperations from './keysExplicitlyReferencedByListOperations';
import assertInDevMode from '../../utils/assertInDevMode';
import warn from '../../utils/dev/warn';
import getList from '../../utils/getList';

function applyListOperators(resources, listOperations = {}, newItemKey, newItem) {
  const updatedLists = {};

  const { listWildcard } = getConfiguration();

  const keysExplicitlyReferenced = keysExplicitlyReferencedByListOperations(listOperations);

  function pushPosition(listKey) {
    const existingList = resources.lists[listKey];

    if (!existingList) {
      return;
    }

    if (contains(existingList.positions, newItemKey)) {
      updatedLists[listKey] = existingList;
    } else {
      updatedLists[listKey] = {
        ...existingList,
        positions: [
          ...existingList.positions,
          newItemKey
        ]
      };
    }
  }

  function unshiftPosition(listKey) {
    const existingList = resources.lists[listKey];

    if (!existingList) {
      return;
    }

    if (contains(existingList.positions, newItemKey)) {
      updatedLists[listKey] = existingList;
    } else {
      updatedLists[listKey] = {
        ...existingList,
        positions: [
          newItemKey,
          ...existingList.positions
        ]
      };
    }
  }

  function invalidateList(listKey) {
    updatedLists[listKey] = LIST;
  }

  function applyCustomReducer(listKey, customMerger) {
    const existingList = resources.lists[listKey];

    if (!existingList) {
      return;
    }

    const listWithItems = getList(resources, listKey);

    const positions = customMerger(listWithItems.items, newItem);

    assertInDevMode(() => {
      if (!Array.isArray(positions)) {
        warn(
          `Invalid value '${positions}' returned from custom merger function for list with key '${listKey}'. \
          Check the function you're passing to the merge option returns an array of position values.`
        );
      }
    });

    updatedLists[listKey] = {
      ...existingList,
      positions
    };
  }

  function applyToAllListsNotExplicitlyReferenced(listOperation) {
    without(Object.keys(resources.lists), keysExplicitlyReferenced).forEach((listKey) => {
      listOperation(listKey);
    });
  }

  listOperations.push.forEach((listKey) => {
    if (listKey === listWildcard) {
      applyToAllListsNotExplicitlyReferenced(pushPosition);
    } else {
      pushPosition(listKey);
    }
  });

  listOperations.unshift.forEach((listKey) => {
    if (listKey === listWildcard) {
      applyToAllListsNotExplicitlyReferenced(unshiftPosition);
    } else {
      unshiftPosition(listKey);
    }
  });

  listOperations.invalidate.forEach((listKey) => {
    if (listKey === listWildcard) {
      applyToAllListsNotExplicitlyReferenced(invalidateList);
    } else {
      invalidateList(listKey);
    }
  });

  /**
   * If a custom merger has been supplied, we apply it
   */
  listOperations.merge.forEach((mergerKeyPair) => {
    const [keys, merger] = mergerKeyPair;

    keys.forEach((listKey) => {
      const applyReducer = (_listKey) => applyCustomReducer(_listKey, merger);

      if (listKey === listWildcard) {
        applyToAllListsNotExplicitlyReferenced(applyReducer);
      } else {
        applyCustomReducer(listKey, merger);
      }
    });
  });

  return {
    ...resources.lists,
    ...updatedLists
  };
}

export default applyListOperators;
