import { DESTROYING } from '../../constants/Statuses';

function deleteResourceUpdate(options, previousValues) {
  const { action, key } = options;

  return {
    type: action,
    status: DESTROYING, key,
    previousValues
  };
}

export default deleteResourceUpdate;
