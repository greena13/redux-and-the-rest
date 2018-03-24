import { SUCCESS } from '../../constants/Statuses';

function removeResource(options, key, values, previousValues) {
  const { action } = options;

  return {
    type: action,
    status: SUCCESS, key,
    previousValues
  };
}

export default removeResource;
