import { SUCCESS } from '../constants/Statuses';

/**
 * Whether the item or list has finished being successfully fetched
 * @param {ResourcesItem|ResourcesList} itemOrList The item or list to consider
 * @returns {boolean} True if the item or list was successfully fetched
 */
function isSuccessfullyFetched({ status: { type } }) {
  return type === SUCCESS;
}

export default isSuccessfullyFetched;
