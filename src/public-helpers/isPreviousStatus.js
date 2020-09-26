import contains from '../utils/list/contains';
import arrayFrom from '../utils/array/arrayFrom';

function isPreviousStatus(itemOrList, expectedStatuses) {
  if (!itemOrList.status.previousStatus) {
    return false;
  }

  const { status: { previousStatus: { type } } } = itemOrList;

  return contains(arrayFrom(expectedStatuses), type);
}

export default isPreviousStatus;
