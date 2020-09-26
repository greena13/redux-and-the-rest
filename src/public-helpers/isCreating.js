import { CREATING } from '../constants/Statuses';
import contains from '../utils/list/contains';

/**
 * Whether the item is currently being created on the remote
 * @param {ResourcesItem} itemOrList The item to consider
 * @returns {boolean} True if the item is currently being created on the remote
 */
function isCreating({ status: { type } }) {
  return contains([CREATING], type);
}

export default isCreating;
