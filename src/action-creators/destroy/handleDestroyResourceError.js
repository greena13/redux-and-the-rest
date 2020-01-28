import { DESTROY_ERROR } from '../../constants/Statuses';
import applyTransforms from '../../reducers/helpers/applyTransforms';

function handleDestroyResourceError(options, actionCreatorOptions, httpCode, error) {
  const { transforms, action, key } = options;

  return {
    type: action,
    status: DESTROY_ERROR, key,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      status: {
        type: DESTROY_ERROR,
        httpCode,
        error
      },
    })
  };
}

export default handleDestroyResourceError;
