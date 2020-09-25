import { getConfiguration } from '../configuration';
import assertInDevMode from './assertInDevMode';
import warn from './dev/warn';
import without from './list/without';
import isFunction from './object/isFunction';
import { enqueuePendingAction, isActionPending, registerActionEnd } from './ActionQueue';
import hasDefinedStatus from '../public-helpers/hasDefinedStatus';
import { FETCHING } from '../constants/Statuses';

function getOrFetch(options, resourcesState, params = {}, actionCreatorOptions = {}) {
  const {

    /**
     * Options that change between items and lists
     */
    typeKey, keyFunction, getFunction, fetchFunction, action
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

  if (!itemOrList || !hasDefinedStatus(itemOrList) || evaluateForceCondition(actionCreatorOptions.forceFetch, itemOrList)) {

    if (!isActionPending(action, key)) {
      enqueuePendingAction(action, key);

      /**
       * We wrap dispatching the action in setTimeout to defer it until the next render cycle, allowing you to
       * use the method in a controller's render method, without triggering a warning from React about updating
       * another component's state while it is rendering
       *
       * Note: The evaluating of whether an action is queued or not must still be done synchronously in order
       *       to work.
       */
      setTimeout(() => {

        /**
         * If the item is not already in the store (or we're forcing the fetch operation), we call the fetch action
         * creator to retrieve it in the background and return an empty item or list in the meantime.
         */
        if (store) {
          store.dispatch(fetchFunction(params, without(actionCreatorOptions, ['forceFetch']))).then(() => {
            registerActionEnd(action, key);
          });
        }
      }, 0);
    }

    /**
     * If the item or list is not already in the store, immediately return an empty one with a status of
     * fetching (and then shortly thereafter dispatch an action for the FETCHING status) so our calling code
     * does not immediately get a list or item with an undefined with an undefined status before a FETCHING
     * one
     */
    const emptyItemOrList = getFunction(resourcesState, key);

    return { ...emptyItemOrList, status: { type: FETCHING } };
  }

  return getFunction(resourcesState, key);
}

function evaluateForceCondition(forceFetch, itemOrList) {
  return isFunction(forceFetch) ? forceFetch(itemOrList) : Boolean(forceFetch);
}

export default getOrFetch;
