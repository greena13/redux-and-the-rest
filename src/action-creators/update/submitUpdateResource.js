import { UPDATING } from '../../constants/Statuses';
import applyTransforms from '../../reducers/helpers/applyTransforms';

function submitUpdateResource(options, actionCreatorOptions, values) {
  const { transforms, action, key } = options;

  return {
    type: action,
    status: UPDATING, key,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      values,
      status: { type: UPDATING }
    }),
    previousValues: actionCreatorOptions.previousValues
  };
}

export default submitUpdateResource;
