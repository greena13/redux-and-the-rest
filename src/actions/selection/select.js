import getItemKey from '../../action-creators/helpers/getItemKey';
import warn from '../../utils/dev/warn';

/**************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * A function that can be called when a Redux action should be dispatched to perform an asynchronous action -
 * typically to make a request to an external API and wait for the response.
 * @typedef {function(*): Promise<unknown> | Promise<*>} Thunk
 */

function actionCreator({ action, keyBy }, params, actionCreatorOptions = {}) {
  const key = getItemKey(params, { keyBy });

  return {
    type: action, key, value: actionCreatorOptions.value || true
  };
}

/**************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

function reducer(resources, { type, key, value }) {

  if (resources.items[key]) {
    return {
      ...resources,
      selectionMap: {
        [key]: value
      }
    };
  } else {
    warn(`selectMap is not intended to hold references to items that are not in the store. ${type}'s key '${key}' did not match any of the item keys: ${Object.keys(resources.items).join(', ')}. Check the options passed to select*(). (The selection was ignored.)`);

    return resources;
  }
}

export default {
  reducer,
  actionCreator,
};
