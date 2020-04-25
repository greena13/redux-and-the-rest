import getItemKey from '../../action-creators/helpers/getItemKey';
import without from '../../utils/collection/without';
import wrapInObject from '../../utils/object/wrapInObject';

/** ************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Redux action creator used for deselecting a selected resource item
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} params A string or object that is serialized and used to fill in the dynamic parameters
 *        of the resource's URL
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function actionCreator({ action, keyBy }, params) {
  const normalizedParams = wrapInObject(params, keyBy);
  const key = getItemKey(normalizedParams, { keyBy });

  return {
    type: action,
    key
  };
}

/** ************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

/**
 * Handles removing a selected resource item
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources
 * @param {ActionObject} action Action object to merge into resources state
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, action) {
  const { key } = action;

  return {
    ...resources,
    selectionMap: without(resources.selectionMap, key)
  };
}

export default {
  reducer,
  actionCreator,
};
