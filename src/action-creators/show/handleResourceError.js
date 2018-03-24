import { ERROR } from '../../constants/Statuses';

function handleResourceError(options, key, httpCode, error) {
  const { action } = options;

  return {
    type: action,
    status: ERROR,
    httpCode,
    key, error
  };
}

export default handleResourceError;
