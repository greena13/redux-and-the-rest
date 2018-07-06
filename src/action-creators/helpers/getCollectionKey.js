import serializeKey from '../../utils/serializeKey';
import without from '../../utils/collection/without';

function getCollectionKey(params, { urlOnlyParams }) {
  const keyParams = without(params, urlOnlyParams);

  return serializeKey(keyParams);
}

export default getCollectionKey;
