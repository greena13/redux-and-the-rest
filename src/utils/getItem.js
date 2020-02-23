import { ITEM } from '../constants/DataStructures';

function getItem(resource, key) {
  return resource.items[key] || ITEM;
}

export default getItem;
