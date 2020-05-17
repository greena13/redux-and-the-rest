import without from '../../utils/collection/without';
import wrapInObject from '../../utils/object/wrapInObject';
import getCollectionKey from '../../action-creators/helpers/getCollectionKey';

/** ************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Redux action creator used for clearing a collection from the store
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} params A string or object that is serialized and used to find the item to clear
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function actionCreator({ action, keyBy }, params) {
  const normalizedParams = wrapInObject(params, keyBy);
  const key = getCollectionKey(normalizedParams);

  return { type: action, key };
}

/** ************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

/**
 * Handles clearing the resource collection in a Redux store
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources
 * @param {ActionObject} action The action containing the data to update the resource state
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, action) {
  const { key } = action;

  const { collections } = resources;

  if (collections[key]) {
    return {
      ...resources,

      /**
       * Remove collection with matching key
       */
      collections: without(collections, key),
    };
  } else {
    return resources;
  }
}

export default {
  reducer,
  actionCreator,
};
