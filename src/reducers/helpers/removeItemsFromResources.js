import without from '../../utils/list/without';
import arrayFrom from '../../utils/array/arrayFrom';

function removeItemsFromResources(resources, keys) {
  const _keys = arrayFrom(keys);

  const lists = Object.keys(resources.lists).reduce((memo, id) => {
    const list = resources.lists[id];
    const { positions } = list;

    memo[id] = {
      ...list,
      positions: without(positions, _keys, { stringifyFirst: true })
    };

    return memo;
  }, {});

  return {
    ...resources,
    items: without(resources.items, _keys),
    lists,
    selectionMap: without(resources.selectionMap, _keys),
    newItemKey: resources.newItemKey === keys ? null : resources.newItemKey
  };
}

export default removeItemsFromResources;
