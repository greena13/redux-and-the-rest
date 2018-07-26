import { SUCCESS } from '../../constants/Statuses';
import { ITEM } from '../../constants/DataStructures';
import applyTransforms from '../../reducers/helpers/applyTransforms';
import getItemKey from '../helpers/getItemKey';

function receiveResource(options, values) {
  const { transforms, action, params, keyBy } = options;

  const item = applyTransforms(transforms, options, {
    ...ITEM,
    values,
    status: { type: SUCCESS }
  });

  return {
    type: action,
    status: SUCCESS,
    key: getItemKey([params, item.values], { keyBy }),
    item
  };
}

export default receiveResource;
