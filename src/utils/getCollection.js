import { COLLECTION } from '../constants/DataStructures';
import serializeKey from './serializeKey';

function getCollection({ name }, resource, parameters = {}) {
  const collection = resource.collections[serializeKey(parameters)] || COLLECTION;

  const items = collection.positions.map((key) => resource.items[key]);

  return {
    [name]: items,
    ...collection
  };
}

export default getCollection;
