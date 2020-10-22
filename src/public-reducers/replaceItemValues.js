import getItemKey from '../action-creators/helpers/getItemKey';
import wrapInObject from '../utils/object/wrapInObject';

function replaceItemValues(options, resources, params, values) {
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
          values
        }
      }
    };
  }

  return resources;
}

export default replaceItemValues;
