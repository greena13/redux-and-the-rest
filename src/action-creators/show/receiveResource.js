import { SUCCESS } from '../../constants/Statuses';
import { ITEM } from '../../constants/DataStructures';
import applyTransforms from '../../reducers/helpers/applyTransforms';

function receiveResource(options, key, values) {
  const { transforms, action } = options;
  const item = applyTransforms(transforms, options, {
    ...ITEM,
    values,
    status: { type: SUCCESS }
  });

  return {
    type: action,
    status: SUCCESS,
    key,
    item
  };
}

export default receiveResource;
