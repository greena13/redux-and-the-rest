import { FETCHING } from '../constants/Statuses';

/**
 * Whether the item or list has finished being fetched
 * @param {ResourcesItem|ResourcesList} itemOrList The item or list to consider
 * @returns {boolean} True if the item or list has finished fetching
 */
function isFinishedFetching({ status: { type } }) {
  return Boolean(type) && (type !== FETCHING);
}

export default isFinishedFetching;
