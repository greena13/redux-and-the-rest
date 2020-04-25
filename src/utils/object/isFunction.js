/**
 * Whether a value is a function or not
 * @param {any} value The value to determine whether it's a function
 * @returns {boolean} True if the value is a function
 */
function isFunction(value) {
  return value && (Reflect.apply(Object.prototype.toString, value, []) === '[object Function]' || typeof value === 'function' || value instanceof Function);
}

export default isFunction;
