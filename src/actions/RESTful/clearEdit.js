import { EDITING, ERROR, SUCCESS, } from '../../constants/Statuses';
import getItemKey from '../../action-creators/helpers/getItemKey';
import wrapInObject from '../../utils/object/wrapInObject';
import mergeStatus from '../../reducers/helpers/mergeStatus';

/**************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Redux action creator used for clearing the new resource.
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} params A string or object that is serialized and used to generate the index of the
 *        resource item
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function actionCreator(options, params) {
  const { action, keyBy } = options;

  const normalizedParams = wrapInObject(params, keyBy);
  const key = getItemKey(normalizedParams, { keyBy });

  return {
    type: action,
    key
  };
}

/**************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

/**
 * Handles reducing clearing the new resource item in a Redux store
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources
 * @param {ActionObject} action The action containing the data to update the resource state
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, { key }) {
  const { items } = resources;

  const currentItem = items[key];

  /**
   * We allow resetting the values of resource items that are either currently being edited, or that have
   * failed to update with an external API
   */
  if (currentItem && (currentItem.status.type === EDITING || (currentItem.status.type === ERROR && currentItem.status.originalValues))) {
    const newValues = function(){
      if (currentItem.status.dirty) {
        /**
         * When the resource item has been edited (indicated by the dirty bit), we roll back to the original
         * values store on the first edit
         */
        return currentItem.status.originalValues;
      } else {
        /**
         * When the dirty bit is not set, there is no need to roll back and we return the current resource item
         * values
         */
        return currentItem.values;
      }
    }();

    return {
      ...resources,
      items: {
        ...items,
        [key]: {
          ...currentItem,
          /**
           * We reset the status type back to
           */
          status: mergeStatus(currentItem.status, { type: SUCCESS }, { onlyPersist: ['syncedAt', 'requestedAt'] }),
          values: newValues
        }
      }
    };
  } else {
    return resources;
  }
}

export default {
  reducer,
  actionCreator,
};
