import { SUCCESS } from '../../constants/Statuses';
import { ITEM } from '../../constants/DataStructures';
import applyTransforms from '../../reducers/helpers/applyTransforms';
import getItemKey from '../helpers/getItemKey';

function receiveResource(options, actionCreatorOptions, values) {
  const { transforms, action, params, keyBy, projection } = options;

  const item = applyTransforms(transforms, options, actionCreatorOptions, {
    ...ITEM,
    values,
    status: { type: SUCCESS, syncedAt: Date.now() },
    projection
  });

  return {
    type: action,
    status: SUCCESS,
    key: getItemKey([params, item.values], { keyBy }),
    item
  };
}

export default receiveResource;
