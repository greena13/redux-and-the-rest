import { ITEM } from '../../constants/DataStructures';
import { FETCHING } from '../../constants/Statuses';
import applyTransforms from '../../reducers/helpers/applyTransforms';

function requestResource(options) {
  const { transforms, action, key } = options;

  return {
    type: action,
    status: FETCHING,
    key,
    item: applyTransforms(transforms, options, {
      ...ITEM,
      values: { },
      status: { type: FETCHING },
    })
  };
}

export default requestResource;
