import { DESTROY_ERROR } from '../../constants/Statuses';
import applyTransforms from '../../reducers/helpers/applyTransforms';

function handleDestroyResourceError(options, key, httpCode, error) {
  const { transforms, action } = options;

  return {
    type: action,
    status: DESTROY_ERROR, key,
    item: applyTransforms(transforms, options, {
      status: {
        type: DESTROY_ERROR,
        httpCode,
        error
      },
    })
  };
}

export default handleDestroyResourceError;
