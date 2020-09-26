import { SUCCESS, ERROR } from '../constants/Statuses';
import isCurrentWithPreviousState from './isCurrentWithPreviousState';

function isFinished(itemOrList, expectedPreviousState) {
  return isCurrentWithPreviousState(itemOrList, [SUCCESS, ERROR], expectedPreviousState);
}

export default isFinished;
