import arrayFrom from '../../utils/array/arrayFrom';
import isEmpty from '../../utils/collection/isEmpty';

function normalizeErrors(errorOrErrors, errors) {
  if (!isEmpty(errorOrErrors)) {
    const _errors = arrayFrom(errorOrErrors);

    return {
      error: _errors[0],
      errors: _errors
    };
  } else if (errors) {
    return {
      error: errors[0],
      errors
    };
  } else {
    return {};
  }

}

export default normalizeErrors;
