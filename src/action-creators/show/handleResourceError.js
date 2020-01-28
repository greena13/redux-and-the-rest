import { ERROR } from '../../constants/Statuses';

function handleResourceError(options, actionCreatorOptions, httpCode, error) {
  const { action, key, projection } = options;

  return {
    type: action,
    status: ERROR,
    projection,
    httpCode,
    key,
    error
  };
}

export default handleResourceError;
