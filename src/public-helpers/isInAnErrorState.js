import { ERROR } from '../constants/Statuses';

/**
 * Whether the item or list is in an errored state - usually because the last request failed
 * @param {ResourcesItem|ResourcesList} itemOrList The item or list to consider
 * @returns {boolean} True if the item or list is in an errored state
 */
function isInAnErrorState({ status: { type } }) {
  return type === ERROR;
}

export default isInAnErrorState;

