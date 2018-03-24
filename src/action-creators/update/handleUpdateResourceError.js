import { ERROR } from '../../constants/Statuses';

function handleUpdateResourceError(options, key, httpCode, error) {
  const { action } = options;

  return {
    type: action,
    status: ERROR, key,
    httpCode,
    error
  };
}

export default handleUpdateResourceError;
