import { getConfiguration } from '../configuration';
import assertInDevMode from './assertInDevMode';
import warn from './dev/warn';
import without from './list/without';
import isFunction from './object/isFunction';

function getOrFetch(options, resourcesState, params = {}, actionCreatorOptions = {}) {
  const {

    /**
     * Options that change between items and lists
     */
    typeKey, keyFunction, getFunction, fetchFunction,
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
   * Attempt to retrieve the item or list from the current resources state
   */

  const key = keyFunction(params);

  const itemOrList = resourcesState[typeKey][key];

  if (!itemOrList || evaluateForceCondition(actionCreatorOptions.forceFetch, itemOrList)) {

    /**
     * We wrap dispatching the action in setTimeout to defer it until the next render cycle, allowing you to
     * use the method in a controller's render method, without triggering a warning from React about updating
     * another component's state while it is rendering
     */
    setTimeout(() => {

      /**
       * If the item is not already in the store (or we're forcing the fetch operation), we call the fetch action
       * creator to retrieve it in the background and return an empty item or list in the meantime.
       */
      if (store) {
        store.dispatch(fetchFunction(params, without(actionCreatorOptions, ['forceFetch'])));
      }
    }, 0);
  }

  return getFunction(resourcesState, key);
}

function evaluateForceCondition(forceFetch, itemOrList) {
  return isFunction(forceFetch) ? forceFetch(itemOrList) : Boolean(forceFetch);
}

export default getOrFetch;
