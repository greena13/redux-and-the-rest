import { UPDATING } from '../../constants/Statuses';
import applyTransforms from '../../reducers/helpers/applyTransforms';

function submitUpdateResource(options, values, previousValues) {
  const { transforms, action, key } = options;

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
