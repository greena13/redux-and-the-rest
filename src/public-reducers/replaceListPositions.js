import getListKey from '../action-creators/helpers/getListKey';
import wrapInObject from '../utils/object/wrapInObject';

function replaceListPositions(options, resources, params, positions = []) {
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
          positions
        }
      }
    };
  }

  return resources;
}

export default replaceListPositions;
