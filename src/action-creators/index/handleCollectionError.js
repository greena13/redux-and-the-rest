import { ERROR } from '../../constants/Statuses';

function handleCollectionError(options, key, httpCode, error) {
  const { action } = options;

  return {
    type: action,
    status: ERROR,
    key,
    error,
    httpCode,
  };
}

export default handleCollectionError;
