import { ERROR } from '../../constants/Statuses';

function handleCreateResourceError(options, temporaryKey, httpCode, error) {
  const { action } = options;

  return {
    type: action,
    status: ERROR,
    temporaryKey,
    httpCode,
    error
  };
}

export default handleCreateResourceError;
