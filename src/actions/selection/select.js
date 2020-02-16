import getItemKey from '../../action-creators/helpers/getItemKey';
import warn from '../../utils/dev/warn';
import getActionCreatorNameFrom from '../../action-creators/helpers/getActionCreatorNameFrom';
import wrapInObject from '../../utils/object/wrapInObject';

/**************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Redux action creator used for selecting a resource item and replacing any already selected items
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} params A string or object that is serialized and used to fill in the dynamic parameters
 *        of the resource's URL
 * @param {Object} actionCreatorOptions={} The options passed to the action creator when it is called.
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function actionCreator({ action, keyBy }, params, actionCreatorOptions = {}) {
  const normalizedParams = wrapInObject(params, keyBy);
  const key = getItemKey(normalizedParams, { keyBy });

  return {
    type: action, key, value: actionCreatorOptions.value || true
  };
}

/**************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

/**
 * Handles selecting a resource item and replacing any selected items
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources
 * @param action
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, { type, key, value }) {
  if (resources.items[key]) {
    return {
      ...resources,
      selectionMap: {
        [key]: value
      }
    };
  } else {
    const actionControllerName = getActionCreatorNameFrom(type);

    warn(
      `selectMap is not intended to hold references to items that are not in the store. ${type}'s key ` +
      `'${key}' did not match any of the item keys: ${Object.keys(resources.items).join(', ')}. Check the ` +
      `options passed to ${actionControllerName}(). (The selection was ignored.)`
    );

    return resources;
  }
}

export default {
  reducer,
  actionCreator,
};
