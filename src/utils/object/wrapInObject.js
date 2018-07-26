import isObject from './isObject';
import isString from '../string/isString';

function wrapInObject(target, key) {
  if (!isString(key)) {
    return target;
  }

  if (isObject(target)) {
    return target;
  } else if (!target || target === true) {
    return {};
  } else {
    return { [key]: target };
  }
}

export default wrapInObject;

