import serializeKey from '../../public-helpers/serializeKey';
import isObject from '../../utils/object/isObject';
import arrayFrom from '../../utils/array/arrayFrom';
import hasKey from '../../utils/object/hasKey';
import isUndefined from '../../utils/isUndefined';
import EmptyKey from '../../constants/EmptyKey';

function getItemKey(params, { keyBy, singular }) {
  if (singular) {
    return EmptyKey;
  }

  const _params = arrayFrom(params);

  if (Array.isArray(keyBy) && keyBy.length > 1) {
    const keys = keyBy.reduce((memo, key) => {
      memo[key] = highestPriorityValue(_params, key);

      return memo;
    }, {});

    return serializeKey(keys);
  } else {
    return highestPriorityValue(_params, keyBy);
  }
}

function highestPriorityValue(targets, key) {
  const firstMatch = targets.find((target) => {
    if (isObject(target)) {
      return hasKey(target, key) && !isUndefined(target[key]);
    } else {
      return target;
    }
  });

  return isObject(firstMatch) ? firstMatch[key] : firstMatch;
}


export default getItemKey;
