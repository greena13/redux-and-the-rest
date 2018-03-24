import { UPDATING } from '../../constants/Statuses';
import applyTransforms from '../../reducers/helpers/applyTransforms';

function submitUpdateResource(options, key, values, previousValues) {
  const { transforms, action } = options;

  return {
    type: action,
    status: UPDATING, key,
    item: applyTransforms(transforms, options, {
      values,
      status: { type: UPDATING }
    }),
    previousValues
  };
}

export default submitUpdateResource;
