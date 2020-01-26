import { COLLECTION } from '../constants/DataStructures';
import serializeKey from './serializeKey';

/**
 * @typedef {Object} ResourceCollectionWithItems Collection of resources, with its items in an array
 * @extends ResourceCollection
 */

/**
 * Returns a resource collection
 * @param {ResourceOptions} resourceOptions
 * @param {ResourcesReduxState} resource
 * @param {Object|any} parameters
 * @returns {ResourceCollectionWithItems}
 */
function getCollection({ name }, resource, parameters = {}) {
  const collection = resource.collections[serializeKey(parameters)] || COLLECTION;

  const items = collection.positions.map((key) => resource.items[key]);

  return {
    [name]: items,
    ...collection
  };
}

export default getCollection;
