import arrayFrom from '../../utils/array/arrayFrom';
import getCollectionKey from './getCollectionKey';

function getCollectionKeys(collectionKeys, urlOnlyParams) {
  return arrayFrom(collectionKeys).map((collectionKey) => getCollectionKey(collectionKey, { urlOnlyParams }));
}

function extractCollectionOperations(actionCreatorOptions, urlOnlyParams) {
  const { push, unshift, invalidate } = actionCreatorOptions;

  return {
    push: getCollectionKeys(push, urlOnlyParams),
    unshift: getCollectionKeys(unshift, urlOnlyParams),
    invalidate: getCollectionKeys(invalidate, urlOnlyParams),
  };
}

export default extractCollectionOperations;
