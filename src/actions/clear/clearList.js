import without from '../../utils/list/without';
import wrapInObject from '../../utils/object/wrapInObject';
import getListKey from '../../action-creators/helpers/getListKey';

/** ************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Redux action creator used for clearing a list from the store
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} params A string or object that is serialized and used to find the item to clear
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function actionCreator({ action, keyBy }, params) {
  const normalizedParams = wrapInObject(params, keyBy);
  const key = getListKey(normalizedParams);

  return { type: action, key };
}

/** ************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

/**
 * Handles clearing the resource list in a Redux store
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources
 * @param {ActionObject} action The action containing the data to update the resource state
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, action) {
  const { key } = action;

  const { lists } = resources;

  if (lists[key]) {
    return {
      ...resources,

      /**
       * Remove list with matching key
       */
      lists: without(lists, key),
    };
  } else {
    return resources;
  }
}

export default {
  reducer,
  actionCreator,
};
