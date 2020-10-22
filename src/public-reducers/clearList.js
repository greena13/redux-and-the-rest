import getListKey from '../action-creators/helpers/getListKey';
import wrapInObject from '../utils/object/wrapInObject';
import without from '../utils/list/without';
import { getConfiguration } from '../configuration';

function clearList(options, resources, params) {
  if (params === getConfiguration().listWildcard) {
    return {
      ...resources,
      lists: {}
    };
  }

  const { keyBy, urlOnlyParams } = options;
  const key = getListKey(wrapInObject(params, keyBy), { urlOnlyParams });

  const { lists } = resources;

  if (lists[key]) {
    return {
      ...resources,

      /**
       * Remove list with matching key
       */
      lists: without(lists, key),
    };
  }

  return resources;
}

export default clearList;
