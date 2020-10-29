import { LIST } from '../constants/DataStructures';
import EmptyKey from '../constants/EmptyKey';

/**
 * @typedef {Object} ResourceListWithItems List of resources, with its items in an array
 * @extends ResourcesList
 */

/**
 * Returns a resource list
 * @param {ResourcesReduxState} resources The resources redux state
 * @param {Object|any} [listKey=''] The (already parsed) key for the list (this function does not perform
 *        key serialization)
 * @returns {ResourceListWithItems} the resource list with items
 */
function getList(resources, listKey = EmptyKey) {
  const list = resources.lists[listKey] || LIST;

  const items = list.positions.map((key) => resources.items[key]);

  return {
    ...list,
    items
  };
}

export default getList;
