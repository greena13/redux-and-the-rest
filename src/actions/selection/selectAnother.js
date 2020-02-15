import warn from '../../utils/dev/warn';
import getItemKey from '../../action-creators/helpers/getItemKey';
import getActionCreatorNameFrom from '../../action-creators/helpers/getActionCreatorNameFrom';

/**************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Redux action creator used for selecting a resource item and adding it to those already selected
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} params A string or object that is serialized and used to fill in the dynamic parameters
 *        of the resource's URL
 * @param {Object} actionCreatorOptions={} The options passed to the action creator when it is called.
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
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

/**
 * Handles selecting a resource item and adding it to those already selected
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
        ...resources.selectionMap,
        [key]: value
      }
    };
  } else {
    const actionCreatorName = getActionCreatorNameFrom(type);

    warn(
      `selectMap is not intended to hold references to items that are not in the store. ${type}'s key ` +
      `'${key}' did not match any of the item keys: ${Object.keys(resources.items).join(', ')}. Check the ` +
      `options passed to ${actionCreatorName}(). (The selection was ignored.)`
    );

    return resources;
  }
}

export default {
  reducer,
  actionCreator,
};
