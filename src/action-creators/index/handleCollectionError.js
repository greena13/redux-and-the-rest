import { ERROR } from '../../constants/Statuses';

function handleCollectionError(options, httpCode, error) {
  const { action, key, projection } = options;

  return {
    type: action,
    status: ERROR,
    projection,
    key,
    error,
    httpCode,
  };
}

export default handleCollectionError;
