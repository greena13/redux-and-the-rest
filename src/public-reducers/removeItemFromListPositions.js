import wrapInObject from '../utils/object/wrapInObject';
import getItemKey from '../action-creators/helpers/getItemKey';
import without from '../utils/list/without';
import getListKeysArray from './getListKeysArray';

function removeItemFromListPositions(options, resources, listParams, itemParams) {
  const { keyBy, singular } = options;
  const itemKey = getItemKey(wrapInObject(itemParams, keyBy), { keyBy, singular });

  /**
   * If the list param is the list wildcard, we remove the item from *all* lists
   */
  return {
    ...resources,
    lists: getListKeysArray(options, resources, listParams).reduce((memo, listKey) => {
      const list = resources.lists[listKey];

      memo[listKey] = {
        ...list,
        positions: without(list.positions, itemKey)
      };

      return memo;
    }, {})
  };
}

export default removeItemFromListPositions;
