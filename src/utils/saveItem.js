import adaptOptionsForSingularResource from '../action-creators/helpers/adaptOptionsForSingularResource';
import getItem from './getItem';
import wrapInObject from './object/wrapInObject';
import getItemKey from '../action-creators/helpers/getItemKey';
import { isCreated } from '../public-helpers/index';

function saveItem(options, resourcesState, paramsOrValues, valuesOrActionCreatorOptions, optionalActionCreatorOptions) {
  const {
    keyBy, singular
  } = options;

  /**
   * Retrieve the direct connection to the Redux store the user is expected to set using the configure() function
   */

  const { values, params, actionCreatorOptions } =
    adaptOptionsForSingularResource({ paramsOptional: false, acceptsValues: true }, [
      paramsOrValues,
      valuesOrActionCreatorOptions,
      optionalActionCreatorOptions
    ]);

  const normalizedParams = wrapInObject(params, keyBy);
  const key = getItemKey(normalizedParams, { keyBy, singular });

  const existingItem = getItem(resourcesState, key);

  if (isCreated(existingItem)) {
    return options.updateItem(params, values, actionCreatorOptions);
  }

  return options.createItem(params, values, actionCreatorOptions);
}

export default saveItem;
