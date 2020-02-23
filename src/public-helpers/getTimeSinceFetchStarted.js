import { FETCHING } from '../constants/Statuses';

/**
 * The time in milliseconds since the item or collection was last requested
 * @param {ResourcesItem|ResourcesCollection} itemOrCollection The item or collection to consider
 * @returns {number} Number of milliseconds since the item or collection was requested
 */
function getTimeSinceFetchStarted({ status: { type, requestedAt } }){
  return type === FETCHING ? Date.now() - requestedAt : 0;
}

export default getTimeSinceFetchStarted;
