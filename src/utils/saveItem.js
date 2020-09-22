import { getConfiguration } from '../configuration';
import assertInDevMode from './assertInDevMode';
import adaptOptionsForSingularResource from '../action-creators/helpers/adaptOptionsForSingularResource';
import getItem from './getItem';
import wrapInObject from './object/wrapInObject';
import getItemKey from '../action-creators/helpers/getItemKey';
import isNew from '../public-helpers/isNew';
import hasDefinedStatus from '../public-helpers/hasDefinedStatus';

function saveItem(options, resourcesState, paramsOrValues, valuesOrActionCreatorOptions, optionalActionCreatorOptions) {
  const {
    keyBy, singular
  } = options;

  /**
   * Retrieve the direct connection to the Redux store the user is expected to set using the configure() function
   */

  const { store } = getConfiguration();

  assertInDevMode(() => {
    if (!store) {
      throw 'Cannot use saveItem() without setting the store instance using the configure() function. Falling back to returning an empty item.';
    }
  });

  const { values, params, actionCreatorOptions } =
    adaptOptionsForSingularResource({ paramsOptional: false, acceptsValues: true }, [
      paramsOrValues,
      valuesOrActionCreatorOptions,
      optionalActionCreatorOptions
    ]);

  const normalizedParams = wrapInObject(params, keyBy);
  const key = getItemKey(normalizedParams, { keyBy, singular });

  const existingItem = getItem(resourcesState, key);

  if (!hasDefinedStatus(existingItem) || isNew(existingItem)) {
    return options.createItem(params, values, actionCreatorOptions);
  }

  return options.updateItem(params, values, actionCreatorOptions);
}

export default saveItem;
