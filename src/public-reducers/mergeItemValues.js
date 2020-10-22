import getItemKey from '../action-creators/helpers/getItemKey';
import wrapInObject from '../utils/object/wrapInObject';

function mergeItemValues(options, resources, params, newValues = {}) {
  const { keyBy, singular } = options;
  const key = getItemKey(wrapInObject(params, keyBy), { keyBy, singular });

  const item = resources.items[key];

  if (item) {
    return {
      ...resources,
      items: {
        ...resources.items,
        [key]: {
          ...item,
          values: {
            ...item.values,
            ...newValues
          }
        }
      }
    };
  }

  return resources;
}

export default mergeItemValues;
