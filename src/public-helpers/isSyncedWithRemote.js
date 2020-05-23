import isSyncingWithRemote from './isSyncingWithRemote';

/**
 * Whether the item or collection has finished syncing with the remote
 * @param {ResourcesItem|ResourcesCollection} itemOrCollection The item or collection to consider
 * @returns {boolean} True if the item or collection has finished fetching
 */
function isSyncedWithRemote(itemOrCollection) {
  return !isSyncingWithRemote(itemOrCollection);
}

export default isSyncedWithRemote;
