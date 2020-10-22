import { getConfiguration } from '../configuration';
import arrayFrom from '../utils/array/arrayFrom';
import getListKey from '../action-creators/helpers/getListKey';

function getListKeysArray({ urlOnlyParams }, resources, listParams) {
  if (listParams === getConfiguration().listWildcard) {
    return Object.keys(resources.lists);
  } else {
    return arrayFrom(listParams).map((_listParams) => getListKey(_listParams, { urlOnlyParams }));
  }
}

export default getListKeysArray;
