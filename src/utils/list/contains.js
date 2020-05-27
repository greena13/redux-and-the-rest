import isObject from '../object/isObject';
import hasKey from '../object/hasKey';
import isString from '../string/isString';
import isUndefined from '../isUndefined';

function contains(list, item, options = {}) {
  if (Array.isArray(list) || isString(list)) {
    if (options.stringifyFirst) {

      return !isUndefined(
        list.find((listItem) => listItem.toString() === item.toString())
      );

    } else {
      return list.indexOf(item) !== -1;
    }
  } else if (isObject(list)) {
    return hasKey(list, item);
  } else {
    if (options.stringifyFirst) {
      return list.toString() === item.toString();
    } else {
      return list === item;
    }
  }
}

export default contains;
