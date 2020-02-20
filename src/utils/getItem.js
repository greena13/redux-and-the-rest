import serializeKey from '../public-helpers/serializeKey';
import isObject from './object/isObject';
import arrayFrom from './array/arrayFrom';
import internalGetItem from './internalGetItem';

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

  return internalGetItem(resource, key);
}

export default getItem;
