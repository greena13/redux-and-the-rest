import without from '../../utils/collection/without';
import arrayFrom from '../../utils/array/arrayFrom';

function removeItemsFromResources(resources, keys) {
  const _keys = arrayFrom(keys);

  const collections = Object.keys(resources.collections).reduce((memo, id) => {
    const collection = resources.collections[id];
    const { positions } = collection;

    memo[id] = {
      ...collection,
      positions: without(positions, _keys, { stringifyFirst: true })
    };

    return memo;
  }, {});

  return {
    ...resources,
    items: without(resources.items, _keys),
    collections,
    selectionMap: without(resources.selectionMap, _keys),
    newItemKey: resources.newItemKey === keys ? null : resources.newItemKey
  };
}

export default removeItemsFromResources;
