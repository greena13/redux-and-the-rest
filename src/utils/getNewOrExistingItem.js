import { ITEM } from '../constants/DataStructures';

function getNewOrExistingItem(resource, params) {
  return resource.items[params] || resource.items[resource.newItemKey] || ITEM;
}

export default getNewOrExistingItem;
