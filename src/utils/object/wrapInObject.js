import isObject from './isObject';

function wrapInObject(target, key) {
  if (isObject(target)) {
    return target;
  } else if (!target || target === true) {
    return {};
  } else {
    return { [key]: target };
  }
}

export default wrapInObject;

