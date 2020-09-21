/**
 * Whether the supplied key matches the current new item key
 * @param {ResourcesReduxState} resource The current resource state
 * @param {String} key The key to check for a match against the new item key
 * @returns {boolean} True the key matches the new item key
 */
function isNewItemKey({ newItemKey }, key) {
  return newItemKey && key === newItemKey;
}

export default isNewItemKey;
