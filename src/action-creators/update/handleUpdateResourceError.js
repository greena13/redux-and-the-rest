import { ERROR } from '../../constants/Statuses';

function handleUpdateResourceError(options, actionCreatorOptions, httpCode, error) {
  const { action, key } = options;

  return {
    type: action,
    status: ERROR, key,
    httpCode,
    error
  };
}

export default handleUpdateResourceError;
