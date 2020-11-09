import warn from '../../utils/dev/warn';
import getItemKey from '../../action-creators/helpers/getItemKey';
import wrapInObject from '../../utils/object/wrapInObject';
import arrayFrom from '../../utils/array/arrayFrom';
import hasKey from '../../utils/object/hasKey';

/** ************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Redux action creator used for selecting a resource item and adding it to those already selected
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} params A string or object that is serialized and used to fill in the dynamic parameters
 *        of the resource's URL
 * @param {Object} [actionCreatorOptions={}] The options passed to the action creator when it is called.
 * @param {*} actionCreatorOptions.value The value to store with the selection. By default it's the value, true,
 *        but can be any contextually significant value.
 * @param {*} actionCreatorOptions.values The value to store with the selection. By default it's the value, true,
 *        but can be any contextually significant value.
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function actionCreator({ action, keyBy, singular }, params, actionCreatorOptions = {}) {
  const keys = arrayFrom(params).map((itemParams) => getItemKey(wrapInObject(itemParams, keyBy), { keyBy, singular }));

  return {
    type: action, keys, values: arrayFrom(actionCreatorOptions.value || actionCreatorOptions.values || Array(keys.length).fill(true))
  };
}

/** ************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

/**
 * Handles selecting a resource item and adding it to those already selected
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources
 * @param {ActionObject} action Action object to merge into resources state
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, action) {
  const { type, keys, values } = action;

  const newSelectionMap = keys.reduce((memo, key, index) => {
    const value = values[index];

    if (hasKey(resources.items, key)) {
      return {
        ...memo,
        [key]: value
      };
    } else {
      warn(
        `selectMap is not intended to hold references to items that are not in the store. ${type}'s key ` +
        `'${key}' did not match any of the item keys: ${Object.keys(resources.items).join(', ')}. Check the ` +
        'options passed to selectAnotherItem(). (The selection was ignored.)'
      );

      return memo;
    }
  }, {});

  return {
    ...resources,
    selectionMap: {
      ...resources.selectionMap,
      ...newSelectionMap
    }
  };
}

export default {
  reducer,
  actionCreator,
};
