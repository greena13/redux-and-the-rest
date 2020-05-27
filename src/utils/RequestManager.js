import hasKey from './object/hasKey';
import isEmpty from './list/isEmpty';

let requestsMap = {};

/**
 * Records that a request is being made to a particular URL using a HTTP request type
 * @param {string} requestType The HTTP request type being used for the request
 * @param {string} url The destination URL for the request
 * @return {void}
 */
export function registerRequestStart(requestType, url) {

  /**
   * We index first on URL as it's the most unique, instantiating a record for it if doesn't already exist
   */
  if (!hasKey(requestsMap, url)) {
    requestsMap[url] = {};
  }

  /**
   * We then index on request type, as it's the least unique, but still required to differentiate between
   * requests to the same endpoint, using different HTTP methods
   */
  if (!hasKey(requestsMap[url], requestType)) {
    requestsMap[url][requestType] = [];
  }

  /**
   * We store the request record as an array, to account for when the force option is used and we need to
   * keep track of multiple requests to the same URL with the same HTTP request type.
   *
   * A date is used purely for debugging purposes - we could use any value here to occupy the elements in
   * the array.
   */
  requestsMap[url][requestType].push(Date.now);
}

export function registerRequestEnd(requestType, url) {
  if (hasKey(requestsMap, url)) {
    if (hasKey(requestsMap[url], requestType)) {

      /**
       * We shift the first element of the array of outstanding request records. We assume the requests are
       * responded to in the same order that they are made because it doesn't really matter if that's not the case -
       * all we are concerned with is the total number of requests.
       */
      requestsMap[url][requestType].shift();

      /**
       * We clean up after ourselves and delete the array if there is no more outstanding requests for that URL and
       * HTTP request type.
       */
      if (isEmpty(requestsMap[url][requestType])) {
        Reflect.deleteProperty(requestsMap[url], requestType);
      }
    }

    /**
     * Continuing the cleanup, we remove the object for the request URL if there are no requests of any HTTP method
     * outstanding.
     */
    if (isEmpty(requestsMap[url])) {
      Reflect.deleteProperty(requestsMap, url);
    }
  }
}

/**
 * Retrieves whether a request is outstanding to a particular URL and using a HTTP method
 * @param {string} requestType The HTTP request type being used for the request
 * @param {string} url The destination URL for the request
 * @returns {boolean} true if there is a matching outstanding request
 */
export function isRequestInProgress(requestType, url) {
  return hasKey(requestsMap, url) && hasKey(requestsMap[url], requestType);
}

/**
 * Clears all records of outstanding requests - only used in testing.
 * @returns {void}
 */
export function clearRegisteredRequests() {
  requestsMap = {};
}
