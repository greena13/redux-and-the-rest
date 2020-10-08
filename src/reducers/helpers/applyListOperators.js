import { LIST } from '../../constants/DataStructures';
import contains from '../../utils/list/contains';
import { getConfiguration } from '../../configuration';
import without from '../../utils/list/without';
import getList from '../../utils/getList';
import getItem from '../../utils/getItem';
import keysExplicitlyReferencedByListOperations from './keysExplicitlyReferencedByListOperations';
import assertInDevMode from '../../utils/assertInDevMode';
import warn from '../../utils/dev/warn';

function applyListOperators(resources, listOperations = {}, temporaryKey) {
  const updatedLists = {};

  const { listWildcard } = getConfiguration();

  const keysExplicitlyReferenced = keysExplicitlyReferencedByListOperations(listOperations);

  function pushPosition(listKey) {
    const existingList = resources.lists[listKey] || LIST;

    if (contains(existingList.positions, temporaryKey)) {
      updatedLists[listKey] = existingList;
    } else {
      updatedLists[listKey] = {
        ...existingList,
        positions: [
          ...existingList.positions,
          temporaryKey
        ]
      };
    }
  }

  function unshiftPosition(listKey) {
    const existingList = resources.lists[listKey] || LIST;

    if (contains(existingList.positions, temporaryKey)) {
      updatedLists[listKey] = existingList;
    } else {
      updatedLists[listKey] = {
        ...existingList,
        positions: [
          temporaryKey,
          ...existingList.positions
        ]
      };
    }
  }

  function invalidateList(listKey) {
    updatedLists[listKey] = LIST;
  }

  function applyCustomReducer(listKey, customMerger) {
    const newItem = getItem(resources, temporaryKey);
    const currentList = getList(resources, listKey).items;

    const positions = customMerger([...currentList], newItem);

    assertInDevMode(() => {
      if (!Array.isArray(positions)) {
        warn(
          `Invalid value '${positions}' returned from custom merger function for list with key '${listKey}'. \
          Check the function you're passing to the merge option returns an array of position values.`
        );
      }
    });

    updatedLists[listKey] = {
      ...currentList,
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
