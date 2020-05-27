import isSyncingWithRemote from './isSyncingWithRemote';

/**
 * Whether the item or list has finished syncing with the remote
 * @param {ResourcesItem|ResourcesList} itemOrList The item or list to consider
 * @returns {boolean} True if the item or list has finished fetching
 */
function isSyncedWithRemote(itemOrList) {
  return !isSyncingWithRemote(itemOrList);
}

export default isSyncedWithRemote;
