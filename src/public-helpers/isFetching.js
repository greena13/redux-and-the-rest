import { FETCHING } from '../constants/Statuses';
import contains from '../utils/list/contains';

/**
 * Whether the item or list is currently being fetched from the remote
 * @param {ResourcesItem|ResourcesList} itemOrList The item or list to consider
 * @returns {boolean} True if the item or list has finished fetching
 */
function isFetching({ status: { type } }) {
  return Boolean(type) && contains([FETCHING], type);
}

export default isFetching;
