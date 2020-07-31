import { ERROR, NEW } from '../constants/Statuses';
import isUndefined from '../utils/isUndefined';

/**
 * Whether the resource item is new and has yet to be saved to the server
 * @param {ResourcesItem} item The item to evaluate
 * @returns {boolean} True if the resource item is new
 */
function isNew({ status: { type, syncedAt } }) {
  return type === NEW || isUndefined(type) || (type === ERROR && !syncedAt);
}

export default isNew;
