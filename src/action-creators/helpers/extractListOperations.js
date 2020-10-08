import arrayFrom from '../../utils/array/arrayFrom';
import getListKey from './getListKey';

function getListKeys(listKeys, urlOnlyParams) {
  return arrayFrom(listKeys).map((listKey) => getListKey(listKey, { urlOnlyParams }));
}

function extractListOperations(actionCreatorOptions, urlOnlyParams) {
  const { push, unshift, invalidate, merge = [] } = actionCreatorOptions;

  return {
    push: getListKeys(push, urlOnlyParams),
    unshift: getListKeys(unshift, urlOnlyParams),
    invalidate: getListKeys(invalidate, urlOnlyParams),
    merge: merge.map((mergerKeyPair) => {
      const [keys, merger] = mergerKeyPair;

      return [getListKeys(keys), merger];
    })
  };
}

export default extractListOperations;
