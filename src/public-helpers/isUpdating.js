import { UPDATING } from '../constants/Statuses';
import contains from '../utils/list/contains';

/**
 * Whether the item is currently being updated on the remote
 * @param {ResourcesItem} itemOrList The item to consider
 * @returns {boolean} True if the item is currently being updated on the remote
 */
function isUpdating({ status: { type } }) {
  return contains([UPDATING], type);
}

export default isUpdating;
