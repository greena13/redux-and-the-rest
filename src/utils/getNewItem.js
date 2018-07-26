import { ITEM } from '..';

function getNewItem(resource) {
  return resource.items[resource.newItemKey] || ITEM;
}

export default getNewItem;
