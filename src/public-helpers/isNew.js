import { ERROR, NEW } from '../constants/Statuses';

/**
 * Whether the resource item is new and has yet to be saved to the server
 * @param {ResourcesItem} item The item to evaluate
 * @returns {boolean} True if the resource item is new
 */
function isNew({ status: { type, syncedAt } }) {
  return type === NEW || type === null || (type === ERROR && !syncedAt);
}

export default isNew;
