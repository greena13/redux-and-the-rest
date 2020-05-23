import { CREATING, DESTROYING, FETCHING, PROGRESS, UPDATING } from '../constants/Statuses';
import contains from '../utils/collection/contains';

/**
 * Whether the item or collection is currently syncing with the remote
 * @param {ResourcesItem|ResourcesCollection} itemOrCollection The item or collection to consider
 * @returns {boolean} True if the item or collection has finished fetching
 */
function isSyncingWithRemote({ status: { type } }) {
  return Boolean(type) && contains([FETCHING, CREATING, UPDATING, DESTROYING, PROGRESS], type);
}

export default isSyncingWithRemote;
