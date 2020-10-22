import without from '../utils/list/without';
import getListKeysArray from './getListKeysArray';

function clearList(options, resources, params) {
  const { lists } = resources;

  return {
    ...resources,

    /**
     * Remove list with matching key
     */
    lists: without(lists, getListKeysArray(options, resources, params)),
  };
}

export default clearList;
