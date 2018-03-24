import isEmpty from '../../utils/collection/isEmpty';
import * as queryString from 'query-string';
import without from '../../utils/collection/without';

function generateUrl({ url }, params = {}) {

  const paramsUsedInUrl = [];

  let urlBase = url.replace(/:([A-z?]+)/g, (param) => {
    let paramKey = param.substring(1);
    let paramIsRequired = true;

    if (paramKey.endsWith('?')) {
      paramKey = paramKey.substring(0, paramKey.length - 1);
      paramIsRequired = false;
    }

    const paramValue = params[paramKey];

    if (paramValue) {
      paramsUsedInUrl.push(paramKey);

      return paramValue;
    } else {
      if (paramIsRequired) {
        throw Error(`Required url parameter '${paramKey}' is missing from ${JSON.stringify(params)}.`);
      } else {
        return '';
      }
    }
  });

  if (urlBase.endsWith('/')) {
    urlBase = urlBase.substring(0, urlBase.length - 1);
  }

  const queryParams = without(params, paramsUsedInUrl);

  if (isEmpty(queryParams)) {
    return urlBase;
  } else {
    return `${urlBase}?${queryString.stringify(queryParams)}`
  }
}

export default generateUrl;
