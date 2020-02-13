import { DESTROYING } from '../../constants/Statuses';
import isEmpty from '../../utils/collection/isEmpty';

function deleteResourceUpdate(options, previousValues) {
  const { action, key } = options;

  return {
    type: action,
    status: DESTROYING, key,
    previousValues: isEmpty(previousValues) ? null : previousValues
  };
}

export default deleteResourceUpdate;
