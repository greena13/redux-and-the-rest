import getItemKey from '../action-creators/helpers/getItemKey';
import wrapInObject from '../utils/object/wrapInObject';

function mergeItemStatus(options, resources, params, newStatus = {}) {
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
          status: {
            ...item.status,
            ...newStatus
          }
        }
      }
    };
  }

  return resources;
}

export default mergeItemStatus;
