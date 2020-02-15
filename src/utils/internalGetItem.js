import { ITEM } from '../constants/DataStructures';

function internalGetItem(resource, key) {
  return resource.items[key] || ITEM;
}

export default internalGetItem;
