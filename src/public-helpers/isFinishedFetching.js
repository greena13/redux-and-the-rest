import { FETCHING } from '../constants/Statuses';

/**
 * Whether the item or collection has finished being fetched
 * @param {ResourcesItem|ResourcesCollection} itemOrCollection The item or collection to consider
 * @returns {boolean} True if the item or collection has finished fetching
 */
function isFinishedFetching({ status: { type } }) {
  return Boolean(type) && (type !== FETCHING);
}

export default isFinishedFetching;
