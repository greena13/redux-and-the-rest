import { ITEM } from '..';
import serializeKey from './serializeKey';

function getItem(resource, parameters) {
  return resource.items[serializeKey(parameters)] || ITEM;
}

export default getItem;
