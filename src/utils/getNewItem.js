import { ITEM } from '../constants/DataStructures';

function getNewItem(resource) {
  return resource.items[resource.newItemKey] || ITEM;
}

export default getNewItem;
