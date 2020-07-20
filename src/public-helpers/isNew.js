import { NEW } from '../constants/Statuses';
import isUndefined from '../utils/isUndefined';

/**
 * Whether the resource item is new and has yet to be saved to the server
 * @param {ResourcesItem} item The item to evaluate
 * @returns {boolean} True if the resource item is new
 */
function isNew({ status: { type } }) {
  return type === NEW || isUndefined(type);
}

export default isNew;
