import getListKey from '../action-creators/helpers/getListKey';
import wrapInObject from '../utils/object/wrapInObject';

function getListMetadata(options, resources, params) {
  const { keyBy, urlOnlyParams } = options;
  const key = getListKey(wrapInObject(params, keyBy), { urlOnlyParams });

  const list = resources.lists[key];

  return list && list.metadata;
}

export default getListMetadata;
