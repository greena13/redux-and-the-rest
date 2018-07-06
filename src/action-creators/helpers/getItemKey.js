import serializeKey from '../../utils/serializeKey';
import isString from '../../utils/string/isString';
import isObject from '../../utils/object/isObject';

function getItemKey(params, { keyBy }) {
  if (isObject(params)) {
    if (isString(keyBy)) {
      return params[keyBy];
    } else {
      return serializeKey(params);
    }
  } else {
    return params;
  }
}

export default getItemKey;
