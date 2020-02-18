import isEmpty from '../../utils/collection/isEmpty';
import * as queryString from 'query-string';
import without from '../../utils/collection/without';
import isObject from '../../utils/object/isObject';
import arrayFrom from '../../utils/array/arrayFrom';

function generateUrl({ url, keyBy, ignoreOptionalParams = false }, paramValues = {}) {
  const paramsUsedInUrl = [];
  let isFirstParam = true;

  let urlBase = url.replace(/:([A-z?]+)/g, (urlParameter) => {
    let paramKey = urlParameter.substring(1);
    let paramIsRequired = true;

    if (paramKey.endsWith('?')) {
      paramKey = paramKey.substring(0, paramKey.length - 1);

      if (ignoreOptionalParams) {
        paramsUsedInUrl.push(paramKey);

        return '';
      } else {
        paramIsRequired = false;
      }
    }

    const paramValue = isFirstParam && !isObject(paramValues) ? paramValues : paramValues[paramKey];
    isFirstParam = false;

    if (paramValue) {
      paramsUsedInUrl.push(paramKey);

      return paramValue;
    } else {
      if (paramIsRequired) {
        throw Error(`Required url parameter '${paramKey}' is missing from ${JSON.stringify(paramValues)}.`);
      } else {
        return '';
      }
    }
  });

  if (urlBase.endsWith('/')) {
    urlBase = urlBase.substring(0, urlBase.length - 1);
  }

  if (isObject(paramValues)) {
    const queryParams = without(paramValues, arrayFrom(keyBy).concat(paramsUsedInUrl));

    if (isEmpty(queryParams)) {
      return urlBase;
    } else {
      return `${urlBase}?${queryString.stringify(queryParams)}`;
    }
  } else {
    return urlBase;
  }
}

export default generateUrl;
