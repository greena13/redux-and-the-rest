/**
 * The original values before an edits were performed.
 * @param {ResourceItem} item The item to return the previous values for
 * @returns {Object} The previous values
 */
function getValuesBeforeEditing({ values, status: { dirty, originalValues } }){
  return dirty ? originalValues : values;
}

export default getValuesBeforeEditing;
