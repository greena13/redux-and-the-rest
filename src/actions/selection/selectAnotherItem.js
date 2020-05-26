import warn from '../../utils/dev/warn';
import getItemKey from '../../action-creators/helpers/getItemKey';
import wrapInObject from '../../utils/object/wrapInObject';

/** ************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Redux action creator used for selecting a resource item and adding it to those already selected
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} params A string or object that is serialized and used to fill in the dynamic parameters
 *        of the resource's URL
 * @param {Object} [actionCreatorOptions={}] The options passed to the action creator when it is called.
 * @param {*} actionCreatorOptions.value The value to store with the selection. By default it's the value, true,
 *        but can be any contextually significant value.
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function actionCreator({ action, keyBy, singular }, params, actionCreatorOptions = {}) {
  const normalizedParams = wrapInObject(params, keyBy);
  const key = getItemKey(normalizedParams, { keyBy, singular });

  return {
    type: action, key, value: actionCreatorOptions.value || true
  };
}

/** ************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

/**
 * Handles selecting a resource item and adding it to those already selected
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources
 * @param {ActionObject} action Action object to merge into resources state
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, action) {
  const { type, key, value } = action;
  if (resources.items[key]) {
    return {
      ...resources,
      selectionMap: {
        ...resources.selectionMap,
        [key]: value
      }
    };
  } else {
    warn(
      `selectMap is not intended to hold references to items that are not in the store. ${type}'s key ` +
      `'${key}' did not match any of the item keys: ${Object.keys(resources.items).join(', ')}. Check the ` +
      'options passed to selectAnotherItem(). (The selection was ignored.)'
    );

    return resources;
  }
}

export default {
  reducer,
  actionCreator,
};
