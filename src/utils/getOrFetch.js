import extractVariableArguments from './extractVariableArguments';
import { getConfiguration } from '../configuration';
import assertInDevMode from './assertInDevMode';
import warn from './dev/warn';
import hasKey from './object/hasKey';
import getActionCreatorNameFrom from '../action-creators/helpers/getActionCreatorNameFrom';

function getOrFetch(options, storeLocationOrParams, optionalParams, optionalActionCreatorOptions) {
  const {

    /**
     * Options that change between items and collections
     */

    typeKey, fallbackActionName, keyFunction, getFunction,

    /**
     * Options from resources definition
     */

    actions, actionCreators, resourceName, actionOptions
  } = options;

  /**
   * Process the variable arguments to support specifying where in the Redux store the resources is located,
   * or optionally fallback to the name value passed to resources and only specifying.
   *
   * @example Specifying a store location and an item id
   *  getOrFetchItem('users', 1);
   *
   * @example Specifying only an item id
   *  getOrFetchItem(1);
   */
  const { storeLocation = resourceName, params, actionCreatorOptions = {} } = extractVariableArguments(
    ['storeLocation', 'params', 'actionCreatorOptions'],
    [storeLocationOrParams, optionalParams, optionalActionCreatorOptions]
  );

  /**
   * Retrieve the direct connection to the Redux store the user is expected to set using the configure() function
   */

  const { store } = getConfiguration();

  assertInDevMode(() => {
    if (!store) {
      warn('Cannot use getOrFetchItem() without setting the store instance using the configure() function. Falling back to returning an empty item.');
    }
  });

  /**
   * Get the current resources state, in the Redux store
   */

  const state = store.getState();
  const resources = state[storeLocation];

  assertInDevMode(() => {
    if (!resources) {
      warn(`Could not find resources '${storeLocation}' in the Redux store. Pass the location of the resource as the first argument to getOrFetchItem() or change the 'name' attribute in your resources() definition.`);
    }

    if (!hasKey(actionOptions, fallbackActionName) || !store) {
      warn(`Cannot use getOrFetchItem() without defining a ${fallbackActionName} action for ${resourceName}.`);
    }
  });

  /**
   * Attempt to retrieve the item or collection from the current resources state
   */

  const key = keyFunction(params);

  const itemOrCollection = resources[typeKey][key];

  if (!itemOrCollection) {

    /**
     * If the item is not already in the store, we call the fetch action creator to retrieve it in the
     * background and return an empty item or collection in the meantime.
     */

    const actionCreator = actionCreators[getActionCreatorNameFrom(actions.get(fallbackActionName))];
    store.dispatch(actionCreator(params, actionCreatorOptions));
  }

  return getFunction(resources, key);
}

export default getOrFetch;
