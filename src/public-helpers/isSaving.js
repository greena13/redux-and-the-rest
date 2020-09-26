import { CREATING, UPDATING } from '../constants/Statuses';
import contains from '../utils/list/contains';

/**
 * Whether the item is currently being updated or created (saved) on the remote
 * @param {ResourcesItem} itemOrList The item to consider
 * @returns {boolean} True if the item is currently being updated or created (saved) on the remote
 */
function isSaving({ status: { type } }) {
  return Boolean(type) && contains([CREATING, UPDATING], type);
}

export default isSaving;
