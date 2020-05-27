import { FETCHING } from '../constants/Statuses';

/**
 * The time in milliseconds since the item or list was last requested
 * @param {ResourcesItem|ResourcesList} itemOrList The item or list to consider
 * @returns {number} Number of milliseconds since the item or list was requested
 */
function getTimeSinceFetchStarted({ status: { type, requestedAt } }){
  return type === FETCHING ? Date.now() - requestedAt : 0;
}

export default getTimeSinceFetchStarted;
