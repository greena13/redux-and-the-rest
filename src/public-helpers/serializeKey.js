import isObject from '../utils/object/isObject';
import EmptyKey from '../constants/EmptyKey';

/**
 * Serializes an object to create a consistent key, no matter the ordering of the attributes, suitable to use
 * as a key for resource items and collections.
 * @param {Object|string} target The object to serialize
 * @returns {string} The serialized key
 */
function serializeKey(target) {
  if (isObject(target)) {
    const sortedKeys = Object.keys(target).sort();

    return sortedKeys.map((key) => `${key}=${target[key]}`).join('.');

  } else {
    return target || EmptyKey;
  }
}

export default serializeKey;
