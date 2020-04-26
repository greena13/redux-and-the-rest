import isObject from '../object/isObject';
import isUndefined from '../isUndefined';

function isEmpty(target) {
  if (isObject(target)) {
    return Object.keys(target).length === 0;
  } else if (isUndefined(target)) {
    return true;
  } else {
    return target.length === 0;
  }
}

export default isEmpty;
