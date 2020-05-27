import { CREATING, DESTROYING, FETCHING, PROGRESS, UPDATING } from '../constants/Statuses';
import contains from '../utils/list/contains';

/**
 * Whether the item or list is currently syncing with the remote
 * @param {ResourcesItem|ResourcesList} itemOrList The item or list to consider
 * @returns {boolean} True if the item or list has finished fetching
 */
function isSyncingWithRemote({ status: { type } }) {
  return Boolean(type) && contains([FETCHING, CREATING, UPDATING, DESTROYING, PROGRESS], type);
}

export default isSyncingWithRemote;
