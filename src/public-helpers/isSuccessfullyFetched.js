import { SUCCESS } from '../constants/Statuses';

/**
 * Whether the item or collection has finished being successfully fetched
 * @param {ResourceItem|ResourceCollection} itemOrCollection The item or collection to consider
 * @returns {boolean} True if the item or collection was successfully fetched
 */
function isSuccessfullyFetched({ status: { type } }) {
  return type === SUCCESS;
}

export default isSuccessfullyFetched;
