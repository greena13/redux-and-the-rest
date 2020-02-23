import { EDITING } from '../constants/Statuses';

/**
 * Whether the resource item has been modified since it was last synced with the server
 * @param {ResourceItem} item The item to evaluate
 * @returns {boolean} True if the resource item can be rolled back
 */
function hasBeenEdited({ status: { type, dirty } }) {
  return type === EDITING && dirty;
}

export default hasBeenEdited;
