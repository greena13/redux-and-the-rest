import { LIST } from '../../constants/DataStructures';
import contains from '../../utils/list/contains';

function applyListOperators(lists, listOperations = {}, temporaryKey) {
  const updatedLists = {};

  listOperations.push.forEach((listKey) => {
    const existingList = lists[listKey] || LIST;

    if (contains(existingList, temporaryKey)) {
      return;
    }

    updatedLists[listKey] = {
      ...existingList,
      positions: [
        ...existingList.positions,
        temporaryKey
      ]
    };
  });

  listOperations.unshift.forEach((listKey) => {
    const existingList = lists[listKey] || LIST;

    if (contains(existingList, temporaryKey)) {
      return;
    }

    updatedLists[listKey] = {
      ...existingList,
      positions: [
        temporaryKey,
        ...existingList.positions
      ]
    };
  });

  listOperations.invalidate.forEach((listKey) => {
    updatedLists[listKey] = LIST;
  });

  return {
    ...lists,
    ...updatedLists
  };
}

export default applyListOperators;
