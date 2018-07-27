import { ITEM } from '..';
import serializeKey from './serializeKey';
import isObject from './object/isObject';
import arrayFrom from './array/arrayFrom';

function getItem({ keyBy }, resource, parameters) {
  const key = function(){
    if (isObject(parameters)) {
      const keys = Object.keys(parameters);

      if (keys.length === 1 && keys[0] === arrayFrom(keyBy)[0]) {
        return Object.values(parameters)[0];
      } else {
        return serializeKey(parameters);
      }
    } else {
      return parameters;
    }
  }();

  return resource.items[key] || ITEM;
}

export default getItem;
