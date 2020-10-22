import getListKey from '../action-creators/helpers/getListKey';
import wrapInObject from '../utils/object/wrapInObject';

function mergeListMetadata(options, resources, params, newMetadata = {}) {
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
          metadata: {
            ...list.metadata,
            ...newMetadata
          }
        }
      }
    };
  }

  return resources;
}

export default mergeListMetadata;
