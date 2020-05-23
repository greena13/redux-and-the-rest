/**
 * The time in milliseconds since the item or collection was last synchronised with the external API (fetched,
 * updated, or created)
 * @param {ResourcesItem|ResourcesCollection} itemOrCollection The item or collection to consider
 * @returns {number} Number of milliseconds since the item or collection was last synced with the external API
 */
function getTimeSinceLastSync({ status: { syncedAt } }){
  return syncedAt ? Date.now() - syncedAt : 0;
}

export default getTimeSinceLastSync;
