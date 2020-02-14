/**************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Redux action creator used for clearing all of the selected resource items
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function actionCreator({ action }) {
  return { type: action };
}

/**************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

/**
 * Handles clearing all the selected resource items
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources) {
  return {
    ...resources,
    selectionMap: {}
  };
}

export default {
  reducer,
  actionCreator,
};
