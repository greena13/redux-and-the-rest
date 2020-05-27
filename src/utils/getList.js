import { LIST } from '../constants/DataStructures';
import serializeKey from '../public-helpers/serializeKey';

/**
 * @typedef {Object} ResourceListWithItems List of resources, with its items in an array
 * @extends ResourcesList
 */

/**
 * Returns a resource list
 * @param {ResourcesReduxState} resources The resources redux state
 * @param {Object|any} [parameters={}] The parameters to use to generate a key to use to retrieve the list
 * @returns {ResourceListWithItems} the resource list with items
 */
function getList(resources, parameters = {}) {
  const list = resources.lists[serializeKey(parameters)] || LIST;

  const items = list.positions.map((key) => resources.items[key]);

  return {
    items,
    ...list
  };
}

export default getList;
