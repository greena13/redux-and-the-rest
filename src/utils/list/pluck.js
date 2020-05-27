import isObject from '../object/isObject';
import dictionaryFrom from '../object/dictionaryFrom';
import arrayFrom from '../array/arrayFrom';

function pluck(target, whitelist) {
  const _whitelist = arrayFrom(whitelist);

  if (isObject(target)) {
    const subset = {};

    _whitelist.forEach((attribute) => {
      subset[attribute] = target[attribute];
    });

    return subset;
  } else if (Array.isArray(target)) {
    const whitelistDict = dictionaryFrom(_whitelist);

    return target.reduce((memo, item) => {
      if (whitelistDict[item]) {
        memo.push(item);
      }

      return memo;
    }, []);
  } else {
    return target;
  }
}

export default pluck;
