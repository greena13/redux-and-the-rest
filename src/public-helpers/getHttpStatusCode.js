/**
 * The http status code of the last request related to the resource item or list
 * @param {ResourcesItem|ResourcesList} itemOrList The item or list to consider
 * @returns {number} HTTP status code
 */
function getHttpStatusCode({ status: { httpCode } }){
  return httpCode;
}

export default getHttpStatusCode;
