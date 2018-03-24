import isObject from './isObject';

function objectFrom(target, value = null) {
  if (Array.isArray(target)) {
    return target.reduce((memo, element) => {
      memo[element] = value;

      return memo;
    }, {})
  } else if (isObject(target)) {
    return target;
  } else {
    return { [target]: value }
  }
}

export default objectFrom;
