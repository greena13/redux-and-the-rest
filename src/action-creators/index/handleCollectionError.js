import { ERROR } from '../../constants/Statuses';

function handleCollectionError(options, httpCode, error) {
  const { action, key } = options;

  return {
    type: action,
    status: ERROR,
    key,
    error,
    httpCode,
  };
}

export default handleCollectionError;
