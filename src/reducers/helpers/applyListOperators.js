import { LIST } from '../../constants/DataStructures';
import contains from '../../utils/list/contains';
import { getConfiguration } from '../../configuration';
import without from '../../utils/list/without';
import keysExplicitlyReferencedByListOperations from './keysExplicitlyReferencedByListOperations';
import assertInDevMode from '../../utils/assertInDevMode';
import warn from '../../utils/dev/warn';
import getList from '../../utils/getList';
import hasDefinedStatus from '../../public-helpers/hasDefinedStatus';
import EmptyKey from '../../constants/EmptyKey';

function applyListOperators(resources, listOperations = {}, itemKey) {
  const updatedLists = {};

  const { listWildcard } = getConfiguration();

  const keysExplicitlyReferenced = keysExplicitlyReferencedByListOperations(listOperations);

  function pushPosition(listKey) {
    const existingList = getList(resources, listKey);

    if (!hasDefinedStatus(existingList) && listKey !== EmptyKey) {
      return;
    }

    if (contains(existingList.positions, itemKey)) {
      updatedLists[listKey] = existingList;
    } else {
      updatedLists[listKey] = {
        ...existingList,
        positions: [
          ...existingList.positions,
          itemKey
        ]
      };
    }
  }

  function unshiftPosition(listKey) {
    const existingList = getList(resources, listKey);

    if (!hasDefinedStatus(existingList) && listKey !== EmptyKey) {
      return;
    }

    if (contains(existingList.positions, itemKey)) {
      updatedLists[listKey] = existingList;
    } else {
      updatedLists[listKey] = {
        ...existingList,
        positions: [
          itemKey,
          ...existingList.positions
        ]
      };
    }
  }

  function invalidateList(listKey) {
    const existingList = getList(resources, listKey);

    if (!hasDefinedStatus(existingList) && listKey !== EmptyKey) {
      return;
    }

    updatedLists[listKey] = LIST;
  }

  function applyCustomMerger(listKey, customMerger) {
    const existingList = getList(resources, listKey);

    if (!hasDefinedStatus(existingList) && listKey !== EmptyKey) {
      return;
    }

    const listWithItems = getList(resources, listKey);

    const positions = customMerger(listWithItems.items, resources.items[itemKey]);

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

  function applyCustomSorter(listKey, customSorter) {
    const existingList = resources.lists[listKey];

    if (!existingList) {
      return;
    }

    const listWithItems = getList(resources, listKey);

    const positions = customSorter(listWithItems.items);

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
      const applyMerger = (_listKey) => applyCustomMerger(_listKey, merger);

      if (listKey === listWildcard) {
        applyToAllListsNotExplicitlyReferenced(applyMerger);
      } else {
        applyCustomMerger(listKey, merger);
      }
    });
  });

  /**
   * If a custom merger has been supplied, we apply it
   */
  listOperations.sort.forEach((sorterKeyPair) => {
    const [keys, sorter] = sorterKeyPair;

    keys.forEach((listKey) => {
      const applySorter = (_listKey) => applyCustomSorter(_listKey, sorter);

      if (listKey === listWildcard) {
        applyToAllListsNotExplicitlyReferenced(applySorter);
      } else {
        applyCustomMerger(listKey, sorter);
      }
    });
  });

  return {
    ...resources.lists,
    ...updatedLists
  };
}

export default applyListOperators;
