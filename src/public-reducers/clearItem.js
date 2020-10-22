import getItemKey from '../action-creators/helpers/getItemKey';
import wrapInObject from '../utils/object/wrapInObject';
import without from '../utils/list/without';

function clearItem(options, resources, params) {
  const { keyBy, singular } = options;
  const key = getItemKey(wrapInObject(params, keyBy), { keyBy, singular });

  const { items, selectionMap } = resources;

  if (items[key]) {
    return {
      ...resources,

      /**
       * Remove item with matching key
       */
      items: without(items, key),

      /**
       * Remove it from any active selections
       */
      selectionMap: without(selectionMap, key),
    };
  }

  return resources;
}

export default clearItem;
