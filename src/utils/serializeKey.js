import isObject from './object/isObject';

function serializeKey(target) {
  if (isObject(target)) {
    const sortedKeys = Object.keys(target).sort();

    return sortedKeys.map((key) => `${key}=${target[key]}`).join('.');

  } else {
    return target || '';
  }
}

export default serializeKey;
