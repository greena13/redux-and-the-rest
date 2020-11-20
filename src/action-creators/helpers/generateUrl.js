import isEmpty from '../../utils/list/isEmpty';
import * as queryString from 'query-string';
import without from '../../utils/list/without';
import isObject from '../../utils/object/isObject';
import arrayFrom from '../../utils/array/arrayFrom';
import { getConfiguration } from '../../configuration';

/**
 * Takes a url template and substitutes in the correct values at each url parameter location, from a list of parameter
 * values.
 *
 * @note Values that are specified and don't appear in the url template are encoded as query parameters.
 *
 * @param {Object} options An options hash
 * @param {string|string[]} [options.keyBy={}] The list of attributes that should be excluded from consideration for the
 * @param {string} options.urlTemplate The URL template
 * @param {boolean} [options.ignoreOptionalParams=false] Whether to ig
 * @param {object|string} paramValues The values to use to populate the url template's parameters, specified as either
 *        an object or a single value in the case of template strings that require a single parameter.
 * @returns {string} The fully resolved URL
 */
function generateUrl({ urlTemplate, keyBy, ignoreOptionalParams = false }, paramValues = {}) {
  const [urlBase, paramsUsedInUrl] = insertTemplateParameters(urlTemplate, paramValues, ignoreOptionalParams);

  if (isObject(paramValues)) {

    /**
     * We exclude the attributes used to index/key resource items and lists from appearing in the query
     * parameters (these are assumed to always appear in the url path itself).
     *
     * We add them to the list of parameters that were "used up" in the url path.
     *
     * What's left over, becomes the query parameters of the URL.
     */
    const queryParams = without(paramValues, arrayFrom(keyBy).concat(paramsUsedInUrl));

    /**
     * We only append query parameters if there are any remaining values that haven't been used up or otherwise
     * excluded from appearing in the query parameters
     */
    if (isEmpty(queryParams)) {
      return urlBase;
    } else {
      return `${urlBase}?${queryString.stringify(queryParams, getConfiguration().queryStringOptions)}`;
    }
  } else {
    return urlBase;
  }
}

function insertTemplateParameters(evaluatedUrl, paramValues, ignoreOptionalParams) {
  const paramsUsedInUrl = [];

  /**
   * Bit switch to be flipped after parsing the first parameter in the template string, to support the syntax of
   * specifying a single parameter value directly, without the need to wrap it in an object
   */
  let isFirstParam = true;

  /**
   * Replace all parameters (prefixed with a colon in the template string) in the template with their corresponding
   * values from paramValues.
   */
  let urlBase = evaluatedUrl.replace(/:([A-z?]+)/g, (urlParameter) => {
    let paramKey = urlParameter.substring(1);

    /**
     * Parameters that appear in the url template with a trailing question mark are considered optional and should
     * not cause an error if they're absent from parameterValues
     */
    let paramIsRequired = true;

    if (paramKey.endsWith('?')) {

      /**
       * We strip out the trailing question mark to get the actual name of the optional parameter
       */
      paramKey = paramKey.substring(0, paramKey.length - 1);

      if (ignoreOptionalParams) {

        /**
         * If the ignoreOptionalParams is enabled, we ignore their value in paramValues and instead use an
         * empty string, and exclude them from appearing in the query parameters.
         */
        paramsUsedInUrl.push(paramKey);

        return '';
      } else {
        paramIsRequired = false;
      }
    }

    /**
     * We support specifying a single parameter value directly, without the need to wrap it in an object
     */
    const paramValue = isFirstParam && !isObject(paramValues) ? paramValues : paramValues[paramKey];

    isFirstParam = false;

    if (paramValue) {
      paramsUsedInUrl.push(paramKey);

      return paramValue;
    } else {
      if (paramIsRequired) {

        /**
         * We warn when a required parameter in the template url is absent from the paramValues
         */
        throw Error(`Required url parameter '${paramKey}' is missing from ${JSON.stringify(paramValues, getConfiguration().queryStringOptions)}.`);
      } else {
        return '';
      }
    }
  });

  /**
   * We normalise the url by stripping out any trailing slashes to make it nicer to append the query parameters
   */
  if (urlBase.endsWith('/')) {
    urlBase = urlBase.substring(0, urlBase.length - 1);
  }

  return [urlBase, paramsUsedInUrl];
}

export default generateUrl;
