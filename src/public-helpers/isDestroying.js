import { DESTROYING } from '../constants/Statuses';
import contains from '../utils/list/contains';

/**
 * Whether the item is currently being destroyed on the remote
 * @param {ResourcesItem} itemOrList The item to consider
 * @returns {boolean} True if the item is currently being destroyed on the remote
 */
function isDestroying({ status: { type } }) {
  return Boolean(type) && contains([DESTROYING], type);
}

export default isDestroying;
