import isStatus from './isStatus';
import isPreviousStatus from './isPreviousStatus';

function isCurrentWithPreviousState(itemOrList, currentState, expectedPreviousState) {
  return isStatus(itemOrList, currentState) && isPreviousStatus(itemOrList, expectedPreviousState);
}

export default isCurrentWithPreviousState;
