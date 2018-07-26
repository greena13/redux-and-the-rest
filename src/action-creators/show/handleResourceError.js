import { ERROR } from '../../constants/Statuses';

function handleResourceError(options, httpCode, error) {
  const { action, key } = options;

  return {
    type: action,
    status: ERROR,
    httpCode,
    key,
    error
  };
}

export default handleResourceError;
