import getItemKey from '../../action-creators/helpers/getItemKey';
import { EDITING, NEW } from '../../constants/Statuses';
import { ITEM } from '../../constants/DataStructures';
import applyTransforms from '../../reducers/helpers/applyTransforms';
import assertInDevMode from '../../utils/assertInDevMode';
import warn from '../../utils/dev/warn';
import wrapInObject from '../../utils/object/wrapInObject';
import adaptOptionsForSingularResource from '../../action-creators/helpers/adaptOptionsForSingularResource';

/** ************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Redux action creator used for updating the attributes of a resource item WITHOUT sending those updated
 * attributes to a remote API (yet). This action is used for editing a resource item locally (perhaps across
 * multiple stages or screens) before actually updating it (which sends the new attributes to the remote API).
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} paramsOrValues The first argument which can either be a string or object that is
 *        serialized and used to fill in the dynamic parameters of the resource's URL, or the new attribute values.
 * @param {Object} [valuesOrActionCreatorOptions=undefined] Either the new attribute values to merge into the
 *        exist ones of the resource item or
 * @param {ActionCreatorOptions} [optionalActionCreatorOptions={}] The options passed to the action creator when it is
 *        called.
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function actionCreator(options, paramsOrValues, valuesOrActionCreatorOptions, optionalActionCreatorOptions) {
  const { action, transforms, keyBy, singular } = options;

  const { params, values, actionCreatorOptions } =
    adaptOptionsForSingularResource({ paramsOptional: singular, acceptsValues: true }, [
      paramsOrValues,
      valuesOrActionCreatorOptions,
      optionalActionCreatorOptions
    ]);

  const normalizedParams = wrapInObject(params, keyBy);
  const key = getItemKey(normalizedParams, { keyBy, singular });

  return {
    type: action,
    status: EDITING,
    key,
    singular,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      ...ITEM,
      values,
      status: { type: EDITING }
    })
  };
}

/** ************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

/**
 * Handles reducing a resource item in a Redux store as it's edited (perhaps over multiple stages).
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources
 * @param {ActionObject} action The action containing the data to update the resource state
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, action) {
  const { type, key, item, singular } = action;
  const { items } = resources;

  /**
   * We warn about editing a resource that doesn't actually exist in the redux store
   */
  assertInDevMode(() => {
    if (!items[key]) {
      if (singular) {
        warn(
          'Use newItem() to create a new item or check the arguments passed to editItem(). (A new item was ' +
          'created to contain the edit.)'
        );
      } else {
        warn(
          `${type}'s key '${key}' does not match any items in the store. Use newItem() to create ` +
          'a new item or check the arguments passed to editItem(). (A new item was created to contain the edit.)'
        );
      }
    }
  });

  const currentItem = items[key] || ITEM;

  if (currentItem.status.type === NEW) {
    assertInDevMode(() => {
      if (singular) {
        warn(
          'Use a editItem() to edit new items that have not yet been saved to an external API. Update ignored.'
        );
      } else {
        warn(
          `${type}'s key '${key}' matches a NEW item. Use a editItem() to edit ` +
          'new items that have not yet been saved to an external API. Update ignored.'
        );
      }
    });

    return resources;
  } else {

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

    persistStatus(currentItem, item);

    const newStatus = function () {
      if (currentItem.status.dirty) {

        /**
         * If dirty already exists, this is not the first call to edit the resource item, so we leave the
         * original values
         */
        return item.status;
      } else {

        /**
         * If this is the first edit then we save a reference to the original values (those last retrieved
         * from an external API) for comparision.
         *
         * Note: If it's a subsequent edit, we don't want to override them with the results of the last edit.
         */
        return {
          ...item.status,
          dirty: true,
          originalValues: {
            ...currentItem.values
          }
        };
      }
    }();

    return {
      ...resources,
      items: {
        ...items,
        [key]: {
          ...item,
          values: newValues,
          status: newStatus
        }
      }
    };
  }
}

/**
 * Helper function used to update the a new item to persist relevant status properties.
 * @param {ITEM} currentItem 
 * @param {ITEM} newItem
 * @returns void
 */
function persistStatus(currentItem, newItem) {
  const { syncedAt, requestedAt } = currentItem.status;

  newItem.status = {
    ...newItem.status,
    syncedAt,
    requestedAt,
  };
}

export default {
  reducer,
  actionCreator
};
