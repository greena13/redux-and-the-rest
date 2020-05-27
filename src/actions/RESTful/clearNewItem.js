import { NEW } from '../../constants/Statuses';
import without from '../../utils/list/without';

/** ************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Redux action creator used for clearing the new resource.
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
 * Handles clearing the new resource item in a Redux store
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources) {
  const { newItemKey, items, lists, selectionMap } = resources;

  if (items[newItemKey] && items[newItemKey].status.type === NEW) {
    return {
      ...resources,
      items: without(items, newItemKey),
      lists: Object.keys(lists).reduce((memo, key) => {
        const list = lists[key];

        memo[key] = { ...list, positions: without(list.positions, newItemKey) };

        return memo;
      }, {}),
      selectionMap: without(selectionMap, newItemKey),
      newItemKey: null,
    };
  } else {
    return {
      ...resources,
      newItemKey: null,
    };
  }
}

export default {
  reducer,
  actionCreator,
};
