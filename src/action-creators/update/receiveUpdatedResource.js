import { SUCCESS } from '../../constants/Statuses';
import applyTransforms from '../../reducers/helpers/applyTransforms';

function receiveUpdatedResource(options, key, values, previousValues) {
  const { transforms, action } = options;

  return {
    type: action,
    status: SUCCESS, key,
    item: applyTransforms(transforms, options, {
      values,
      status: { type: SUCCESS }
    }),
    previousValues
  };
}

export default receiveUpdatedResource;
