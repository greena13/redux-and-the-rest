import { ERROR } from '../../constants/Statuses';

function handleCreateResourceError(options, httpCode, error) {
  const { action, key } = options;

  return {
    type: action,
    status: ERROR,
    temporaryKey: key,
    httpCode,
    error
  };
}

export default handleCreateResourceError;
