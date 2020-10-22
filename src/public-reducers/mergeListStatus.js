import getListKey from '../action-creators/helpers/getListKey';
import wrapInObject from '../utils/object/wrapInObject';

function mergeListStatus(options, resources, params, newStatus = {}) {
  const { keyBy, urlOnlyParams } = options;
  const key = getListKey(wrapInObject(params, keyBy), { urlOnlyParams });

  const list = resources.lists[key];

  if (list) {
    return {
      ...resources,
      lists: {
        ...resources.lists,
        [key]: {
          ...list,
          status: {
            ...list.status,
            ...newStatus
          }
        }
      }
    };
  }

  return resources;
}

export default mergeListStatus;
