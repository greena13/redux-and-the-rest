import { RESOURCES } from '../../constants/DataStructures';

/** ************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Redux action creator used for resetting a resource back to empty
 * @param {string} action The type of action
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function actionCreator({ action }) {
  return { type: action };
}

/** ************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

/**
 * Handles resetting a resource Redux store
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer() {
  return RESOURCES;
}

export default {
  reducer,
  actionCreator,
};
