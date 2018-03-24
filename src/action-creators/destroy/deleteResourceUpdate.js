import { DESTROYING } from '../../constants/Statuses';

function deleteResourceUpdate(options, key, previousValues) {
  const { action } = options;

  return {
    type: action,
    status: DESTROYING, key,
    previousValues
  };
}

export default deleteResourceUpdate;
