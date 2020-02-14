import getItemKey from '../../action-creators/helpers/getItemKey';
import without from '../../utils/collection/without';

/**************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Redux action creator used for deselecting a selected resource item
 * @param {ActionObject} action The action containing the data to use to create or refine the new resource item
 * @param {Object|string} params A string or object that is serialized and used to fill in the dynamic parameters
 *        of the resource's URL
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function actionCreator({ action, keyBy }, params) {
  const key = getItemKey(params, { keyBy });

  return {
    type: action,
    key
  };
}

/**************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

/**
 * Handles removing a selected resource item
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources
 * @param action
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, { key }) {
  return {
    ...resources,
    selectionMap: without(resources.selectionMap, key)
  };
}

export default {
  reducer,
  actionCreator,
};
