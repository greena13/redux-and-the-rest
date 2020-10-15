import { getConfiguration } from '../configuration';
import assertInDevMode from './assertInDevMode';
import warn from './dev/warn';
import without from './list/without';
import isFunction from './object/isFunction';
import { enqueuePendingAction, isActionPending, registerActionEnd } from './ActionQueue';
import hasDefinedStatus from '../public-helpers/hasDefinedStatus';
import { FETCHING } from '../constants/Statuses';
import nop from './function/nop';
import isUndefined from './isUndefined';

function getOrFetch(options, resourcesState, params = {}, actionCreatorOptions = {}) {
  const {

    /**
     * Options that change between items and lists
     */
    keyFunction, getFunction, fetchFunction, action, localOnly
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

  const itemOrList = getFunction(resourcesState, key);

  const forceAction = evaluateForceCondition(actionCreatorOptions.forceFetch, itemOrList);

  if (!localOnly && (!hasDefinedStatus(itemOrList) || forceAction)) {
    if (!isActionPending(action, key) || forceAction) {
      enqueuePendingAction(action, key);

      /**
       * We wrap dispatching the action in setTimeout to defer it until the next render cycle, allowing you to
       * use the method in a component's render method, without triggering a warning from React about updating
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
        const fetcher = fetchFunction(params, without(actionCreatorOptions, ['forceFetch']));

        if (isUndefined(fetcher)) {

          /**
           * When action creators return a nop, the fetcher is undefined, so we immediately register the
           * action as ended (it never actually started)
           */
          registerActionEnd(action, key);
        } else {

          /**
           * If the action creator is not a no-operation, we wait until the promise it returns resolves and
           * then mark the action as ended
           */
          fetcher.then(() => registerActionEnd(action, key));
        }

      }, 0);
    }

    /**
     * If the item or list is not already in the store, immediately return an empty one with a status of
     * fetching (and then shortly thereafter dispatch an action for the FETCHING status) so our calling code
     * does not immediately get a list or item with an undefined with an undefined status before a FETCHING
     * one
     */
    return { ...itemOrList, status: { type: FETCHING } };
  }

  return itemOrList;
}

function evaluateForceCondition(forceFetch, itemOrList) {
  return isFunction(forceFetch) ? forceFetch(itemOrList) : Boolean(forceFetch);
}

export default getOrFetch;
