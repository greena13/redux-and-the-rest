import getItemKey from '../../action-creators/helpers/getItemKey';
import without from '../../utils/collection/without';

/**************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

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
