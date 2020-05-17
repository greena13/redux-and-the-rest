import { EDITING, NEW } from '../../constants/Statuses';
import processActionCreatorOptions from '../../action-creators/helpers/processActionCreatorOptions';
import getItemKey from '../../action-creators/helpers/getItemKey';
import applyTransforms from '../../reducers/helpers/applyTransforms';
import assertInDevMode from '../../utils/assertInDevMode';
import warn from '../../utils/dev/warn';

/** ************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Redux action creator used for editing the attributes of a new resource item (one that hasn't been saved to
 * a remote API yet). This action is used for editing a resource item locally (perhaps across
 * multiple stages or screens) before actually saving it (which sends the new attributes to the remote API).
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} paramsOrValues The first argument which can either a string or object that is serialized
 *        and used to fill in the dynamic parameters of the resource's URL (params) or the new attribute values
 *        to merge into the exist ones of the new resource item.
 * @param {Object} valuesOrActionCreatorOptions Either the new attribute values to merge into the exist ones
 *        of the new resource item, or addition options passed to the action creator when it is called.
 * @param {Object} [optionalActionCreatorOptions=undefined] The optional additional options passed to the action controller.
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function actionCreator(options, paramsOrValues, valuesOrActionCreatorOptions, optionalActionCreatorOptions) {
  const { params, values, actionCreatorOptions } = processActionCreatorOptions(
    paramsOrValues,
    valuesOrActionCreatorOptions,
    optionalActionCreatorOptions
  );

  const { action, transforms, keyBy, singular } = options;

  const key = getItemKey(params, { keyBy, singular });

  return {
    type: action,
    status: EDITING,
    key,
    singular,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      values
    })
  };
}


/** ************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

/**
 * Handles reducing a new resource item in a Redux store as it's edited (perhaps over multiple stages).
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources
 * @param {ActionObject} action The action containing the data to update the resource state
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, action) {
  const { type, key, item, singular } = action;
  const { items } = resources;

  const _key = key || resources.newItemKey;

  const currentItem = items[_key];

  if (!currentItem) {
    assertInDevMode(() => {

      /**
       * We warn about editing a resource that doesn't actually exist in the redux store
       */
      if (singular) {
        warn(
          'Use newItem() to create a new item first, or check the arguments passed to editItem(). Update ignored.'
        );
      } else {
        warn(
          `${type}'s key '${_key}' does not match any new items in the store. Use newItem() ` +
          'to create a new item first, or check the arguments passed to editItem(). Update ignored.'
        );
      }
    });

    return resources;

  } else if (currentItem.status.type === NEW) {

    /**
     * We do a shallow merge of the values that already exist in the redux store for the resource item
     * with the new values being supplied as part of the edit.
     *
     * This allows for partial edits - without having to re-specify the entire list of previous attribute values
     */
    const newValues = {
      ...currentItem.values,
      ...item.values
    };

    return {
      ...resources,
      items: {
        ...items,
        [_key]: {
          ...currentItem,
          values: newValues
        }
      }
    };
  } else {
    assertInDevMode(() => {

      /**
       * We warn about editing a resource that isn't new
       */
      warn(
        `${type}'s key '${key}' matches a resource that is NOT new. Use a editItem() to edit ` +
        'existing items. Update ignored.'
      );
    });

    return resources;
  }
}

export default {
  reducer,
  actionCreator,
};
