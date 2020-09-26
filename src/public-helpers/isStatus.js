import contains from '../utils/list/contains';
import arrayFrom from '../utils/array/arrayFrom';

function isStatus({ status: { type } }, expectedStatuses) {
  return contains(arrayFrom(expectedStatuses), type);
}

export default isStatus;
