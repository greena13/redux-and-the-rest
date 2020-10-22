import getItemKey from '../action-creators/helpers/getItemKey';
import wrapInObject from '../utils/object/wrapInObject';

function getItemStatus(options, resources, params) {
  const { keyBy, singular } = options;
  const key = getItemKey(wrapInObject(params, keyBy), { keyBy, singular });

  const item = resources.items[key];

  return item && item.status;
}

export default getItemStatus;
