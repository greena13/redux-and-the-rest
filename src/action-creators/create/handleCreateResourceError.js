import { ERROR } from '../../constants/Statuses';

function handleCreateResourceError(options, actionCreatorOptions, httpCode, error) {
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
