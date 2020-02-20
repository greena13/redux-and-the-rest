import serializeKey from '../../public-helpers/serializeKey';
import without from '../../utils/collection/without';
import isObject from '../../utils/object/isObject';

/**
 * Extracts a normalised stringified key for a collection based on a params object and a list of values that
 * are intended to be used for the collection's url parameters only, and are therefore excluded from the
 * serialized key.
 * @param {Object|string} params The object to use as the source of the vales in the key
 * @param {Object} [options={}] An options hash
 * @param {string[]} [options.urlOnlyParams=[]] An optional list of param keys that should not be
 *        included in the serialized key
 * @returns {string} A serialized key for a collection based on the params passed
 */
function getCollectionKey(params, { urlOnlyParams = [] } = {}) {
  const keyParams = function(){
    if (isObject(params)) {
      return without(params, urlOnlyParams);
    } else {
      return params;
    }
  }();

  return serializeKey(keyParams);
}

export default getCollectionKey;
