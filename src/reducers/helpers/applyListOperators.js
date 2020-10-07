import { LIST } from '../../constants/DataStructures';
import contains from '../../utils/list/contains';
import { getConfiguration } from '../../configuration';
import without from '../../utils/list/without';

function applyListOperators(lists, listOperations = {}, temporaryKey) {
  const updatedLists = {};

  const { listWildcard } = getConfiguration();

  const keysExplicitlyReferenced = [
    ...(listOperations.push || []),
    ...(listOperations.unshift || []),
    ...(listOperations.invalidate || []),
  ];

  function pushPosition(listKey) {
    const existingList = lists[listKey] || LIST;

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
    const existingList = lists[listKey] || LIST;

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

  function applyToAllListsNotExplicitlyReferenced(listOperation) {
    without(Object.keys(lists), keysExplicitlyReferenced).forEach((listKey) => {
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

  return {
    ...lists,
    ...updatedLists
  };
}

export default applyListOperators;
