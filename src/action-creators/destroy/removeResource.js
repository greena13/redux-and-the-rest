import { SUCCESS } from '../../constants/Statuses';

function removeResource(options, actionCreatorOptions, values, previousValues) {
  const { action, key } = options;

  return {
    type: action,
    status: SUCCESS, key,
    previousValues
  };
}

export default removeResource;
