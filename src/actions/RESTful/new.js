import getItemKey from '../../action-creators/helpers/getItemKey';
import { ITEM } from '../../constants/DataStructures';
import { NEW } from '../../constants/Statuses';
import applyTransforms from '../../reducers/helpers/applyTransforms';
import extractCollectionOperations from '../../action-creators/helpers/extractCollectionOperations';
import assertInDevMode from '../../utils/assertInDevMode';
import warn from '../../utils/dev/warn';
import applyCollectionOperators from '../../reducers/helpers/applyCollectionOperators';
import processActionCreatorOptions from '../../action-creators/helpers/processActionCreatorOptions';
import getActionCreatorNameFrom from '../../action-creators/helpers/getActionCreatorNameFrom';

/**************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Redux action creator used for adding a new resource item to the Redux store WITHOUT sending it to a remote API
 * (yet). This action is used for storing a new resource item locally before actually creating it
 * (which sends the new attributes to the remote API).
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} paramsOrValues The first argument which can either a string or object that is serialized
 *        and used to fill in the dynamic parameters of the resource's URL (params) or the new attribute values
 *        to merge into the exist ones of the new resource item, or to use to create the resource item for the
 *        first time.
 * @param {Object} valuesOrActionCreatorOptions Either be the values used by the action creator, or addition
 *        options passed to the action creator when it is called.
 * @param {Object} optionalActionCreatorOptions=undefined The optional additional options passed to the action controller.
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function actionCreator(options, paramsOrValues, valuesOrActionCreatorOptions, optionalActionCreatorOptions) {
  const { params, values, actionCreatorOptions } = processActionCreatorOptions(
    paramsOrValues,
    valuesOrActionCreatorOptions,
    optionalActionCreatorOptions
  );

  const { action, transforms, keyBy, urlOnlyParams } = options;

  /**
   * We automatically generate a new temporary Id if one is not specified
   */
  const temporaryKey = getItemKey([params, values], { keyBy }) || Date.now().toString();

  return {
    type: action,
    status: NEW,
    temporaryKey,
    collectionOperations: extractCollectionOperations(actionCreatorOptions, urlOnlyParams),
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      ...ITEM,
      values,
      status: { type: NEW },
    }),
  };
}

/**************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

/**
 * Handles reducing a resource item in a Redux store as it's created, before being sent to a remote API.
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources
 * @param {ActionObject} action The action containing the data to use to create or refine the new resource item
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, { type, temporaryKey, item, collectionOperations }) {
  assertInDevMode(() => {
    const existingItem = resources.items[temporaryKey];

    if (existingItem) {
      const clearNewActionCreatorName = getActionCreatorNameFrom(type, { replaceVerb: 'clearNew' });

      if (resources.newItemKey === temporaryKey) {
        warn(
          `'${type}' has same key '${temporaryKey}' as the previous new item, which has not finished saving ` +
          'to the server. If you wish to create new items before the previous ones have finished saving, ' +
          'ensure you use unique temporary keys. If you want to discard the previous item, use the ' +
          `${clearNewActionCreatorName}() action. (Previous item was overridden with new values.)`
        );
      } else {
        const actionCreatorName = getActionCreatorNameFrom(type, { replaceVerb: 'edit' });

        warn(
          `'${type}' has same key '${temporaryKey}' as existing item, use ${actionCreatorName}() to ` +
          `update it instead, or ${clearNewActionCreatorName}() if you want to discard the previous values. ` +
          '(Previous item was overridden with new values.)'
        );
      }
    }
  });

  const newItems = {
    ...resources.items,
    [temporaryKey]: {
      ...item,
    }
  };

  return {
    ...resources,
    items: newItems,
    collections: applyCollectionOperators(resources.collections, collectionOperations, temporaryKey),
    newItemKey: temporaryKey
  };
}

export default {
  reducer,
  actionCreator,
};
