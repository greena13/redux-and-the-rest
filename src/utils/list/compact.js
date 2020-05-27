import without from './without';

/**
 * Removes undefined and null values from lists. When passed an array, it returns a new array
 * absent the empty elements. When passed an object, it returns a new object with only the keys and values
 * from the source object for which the value was not empty
 * @param {Array|Object} target The list to remove empty values from
 * @param {Array} [emptyValues=[undefined, null]] List of values to consider empty}
 * @returns {Array|Object} A new list with the empty values removed
 */
function compact(target, emptyValues = [undefined, null]) {
  return without(target, emptyValues);
}

export default compact;
