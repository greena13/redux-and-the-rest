import { ERROR } from '../constants/Statuses';

/**
 * Whether the item or collection is in an errored state - usually because the last request failed
 * @param {ResourcesItem|ResourcesCollection} itemOrCollection The item or collection to consider
 * @returns {boolean} True if the item or collection is in an errored state
 */
function isInAnErrorState({ status: { type } }) {
  return type === ERROR;
}

export default isInAnErrorState;

