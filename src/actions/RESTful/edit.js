import getItemKey from '../../action-creators/helpers/getItemKey';
import { EDITING, ITEM } from '../..';
import applyTransforms from '../../reducers/helpers/applyTransforms';
import assertInDevMode from '../../utils/assertInDevMode';
import warn from '../../utils/dev/warn';

/**************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

function actionCreator(options, params, values, actionCreatorOptions = {}) {
  const { action, transforms, keyBy } = options;

  const key = getItemKey(params, { keyBy });

  return {
    type: action,
    status: EDITING,
    key,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      ...ITEM,
      values,
      status: { type: EDITING }
    })
  };
}

/**************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

function reducer(resources, { type, key, item }) {
  const { items } = resources;

  assertInDevMode(() => {
    if (!items[key]) {
      warn(`${type}'s key '${key}' does not match any items in the store. Use a new*() to create a new item or check the arguments passed to edit*(). (A new item was created to contain the edit.)`);
    }
  });

  const currentItem = items[key] || ITEM;

  const newValues = {
    ...currentItem.values,
    ...item.values
  };

  return {
    ...resources,
    items: {
      ...items,
      [key]: {
        ...item,
        values: newValues,
      }
    }
  };
}

export default {
  reducer,
  actionCreator
};
