import { COLLECTION } from '../constants/DataStructures';
import serializeKey from '../public-helpers/serializeKey';

/**
 * @typedef {Object} ResourceCollectionWithItems Collection of resources, with its items in an array
 * @extends ResourcesCollection
 */

/**
 * Returns a resource collection
 * @param {ResourcesReduxState} resources The resources redux state
 * @param {Object|any} [parameters={}] The parameters to use to generate a key to use to retrieve the collection
 * @returns {ResourceCollectionWithItems} the resource collection with items
 */
function getCollection(resources, parameters = {}) {
  const collection = resources.collections[serializeKey(parameters)] || COLLECTION;

  const items = collection.positions.map((key) => resources.items[key]);

  return {
    items,
    ...collection
  };
}

export default getCollection;
