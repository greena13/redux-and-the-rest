/**
 * The time in milliseconds since the item or list was last synchronised with the external API (fetched,
 * updated, or created)
 * @param {ResourcesItem|ResourcesList} itemOrList The item or list to consider
 * @returns {number} Number of milliseconds since the item or list was last synced with the external API
 */
function getTimeSinceLastSync({ status: { syncedAt } }){
  return syncedAt ? Date.now() - syncedAt : 0;
}

export default getTimeSinceLastSync;
